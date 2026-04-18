const express = require('express');
const router = express.Router();
const Attendance = require('./models/attandence');
const employee = require('./models/employee');
const company = require('./models/company');
const BranchModal = require('./models/branch')
const { sendToClients } = require('./utils/sse');
const { sendTelegramMessage, sendTelegramMessageseperate } = require('./utils/telegram');
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const Essl = require('./models/essllivelogs')
const {
    parseAttendanceDateTime,
    getAttendanceDateUTC,
    getMinutesInAttendanceTimezone,
    ATTENDANCE_TIMEZONE
} = require('./utils/attendanceTime');
const { calculateStats } = require('./services/attendanceService');
const { logEsslEvent } = require('./utils/esslLogger');
const EsslEvent = require('./models/esslEvent');

const ESSL_INPUT_TIMEZONE = process.env.ESSL_INPUT_TIMEZONE || "UTC";

dayjs.extend(utc);
dayjs.extend(timezone);

router.get('/', (req, res) => {
    console.log("➡️ GET request on essl index page");
    res.send('OK');
});
router.post('/', (req, res) => {
    console.log("➡️ POst request on essl index page");
    res.send('OK');
});

router.get('/api/refreshDevice/:deviceSN', async (req, res, next) => {
    const { deviceSN } = req.params;
    const whichcomapny = await company.findOne({ "devices.SN": deviceSN }).select('_id devices');
    // console.log(deviceSN)
    // console.log(whichcomapny)
    if (!whichcomapny) {
        return res.status(400).json({ message: 'Device not Found' });
    }
    return res.status(200).json({ devices: whichcomapny.devices });
});

// Device command polling
router.get('/essl/iclock/devicecmd', (req, res) => {
    console.log("➡️ GET /iclock/devicecmd");
    // console.log("Query:", req.query);
    res.send('OK');
});

// GET request for device for server exist , is receive ok then next requesta on GET /iclock/getrequest
router.get(['/essl/iclock/cdata', '/essl/iclock/cdata.aspx'], (req, res) => {
    // console.log("➡️ GET /iclock/cdata or /iclock/cdata.aspx");
    // console.log("Query params:", req.query);
    res.send('OK iclock/cdata');
});

// Device heartbeat / info request
router.get('/essl/iclock/getrequest.aspx', async (req, res) => {
    // console.log("➡️ GET /iclock/getrequest.aspx");

    const deviceSN = req.query.SN;
    const now = new Date();
    try {
        let kyahua = await company.updateOne(
            { "devices.SN": deviceSN },
            { $set: { "devices.$.lastHeartbeat": now } }
        );
        // console.log(kyahua)
    } catch (error) {
        console.log(error.message)
    }
    res.send('OK');
});

function formatMinutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // pad with leading zero if needed
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}`;
}

router.post(['/essl/iclock/cdata', '/essl/iclock/cdata.aspx'], async (req, res) => {
    try {
        const raw = req.bodyRaw || '';
        const deviceSN = req.query.SN || null;

        if (!raw) return res.send('OK');

        // =========================
        // HANDLE LIVE ATTLOG
        // =========================
        if (/^\d+\s/.test(raw)) {
            const fields = raw.trim().split(/\s+/);

            const attendancee = {
                PIN: fields[0],
                Timestamp: fields[1] + ' ' + fields[2],
                Status: fields[3],
                VerifyMode: fields[4]
            };

            // console.log('⏱ Live Attendance:', attendancee);


            const status = parseInt(attendancee.Status, 10);

            // Only allow punchIn (0) and punchOut (1)
            if (status > 1) return res.send('OK');

            const deviceUserId = attendancee.PIN;
            const recordTime = attendancee.Timestamp;

            // =========================
            // NORMALIZE TIME
            // =========================
            const punchDate = parseAttendanceDateTime(recordTime, ESSL_INPUT_TIMEZONE);
            if (!punchDate || Number.isNaN(punchDate.getTime())) {
                console.warn("Invalid date:", recordTime);
                return res.send('OK');
            }
            punchDate.setSeconds(0, 0);

            const dateObj = getAttendanceDateUTC(punchDate);

            // =========================
            // FIND COMPANY
            // =========================
            const whichCompany = await company.findOne({ "devices.SN": deviceSN }).select('_id telegram telegramNotifcation');


            if (!whichCompany) {
                console.warn(`No company for SN ${deviceSN}`);
                return res.send('OK');
            }

            // manual telegram notoifcation off
            if (process.env.NODE_ENV === "development") {
                // 🔴 Always OFF in development
                whichCompany.telegramNotifcation = false;
            }


            const log = new Essl({
                companyId: whichCompany._id,
                pin: attendancee.PIN,
                timestamp: attendancee.Timestamp, // ✅ UTC fix
                status: parseInt(attendancee.Status),
                verifyMode: parseInt(attendancee.VerifyMode),
                raw: raw
            });

            await log.save();

            // =========================
            // FIND EMPLOYEE
            // =========================
            const employeeDoc = await employee.findOne({
                companyId: whichCompany._id,
                deviceUserId
            }).select('_id branchId empId companyId telegramId userid')
                .populate('userid', 'name');

            if (!employeeDoc) {
                console.warn(`No employee for deviceUserId ${deviceUserId}`);
                return res.send('OK');
            }

            // =========================
            // FETCH SNAPSHOT
            // =========================
            const companyData = await company.findById(employeeDoc.companyId);
            const branch = await BranchModal.findById(employeeDoc.branchId);

            let snapshot = {};

            if (branch?.defaultsetting) {
                snapshot = {
                    officeTime: companyData?.officeTime,
                    gracePeriod: companyData?.gracePeriod,
                    workingMinutes: companyData?.workingMinutes,
                    attendanceRules: companyData?.attendanceRules
                };
            } else {
                snapshot = {
                    officeTime: branch?.setting?.officeTime,
                    gracePeriod: branch?.setting?.gracePeriod,
                    workingMinutes: branch?.setting?.workingMinutes,
                    attendanceRules: branch?.setting?.attendanceRules
                };
            }

            // =========================
            // FIND ATTENDANCE
            // =========================
            let attendance = await Attendance.findOne({
                employeeId: employeeDoc._id,
                date: dateObj
            });

            // =========================
            // COMMON TIME HELPERS
            // =========================
            const parseTime = (t) => {
                if (!t) return null;
                const [h, m] = t.split(':').map(Number);
                return h * 60 + m;
            };

            const isWithinWindow = (valueMin, startMin, endMin) => {
                if (startMin === null || endMin === null) return true;
                if (startMin <= endMin) return valueMin >= startMin && valueMin <= endMin;
                return valueMin >= startMin || valueMin <= endMin;
            };

            const logMinute = getMinutesInAttendanceTimezone(punchDate);
            const punchInStart = parseTime(snapshot?.attendanceRules?.esslPunchInStart);
            const punchInEnd = parseTime(snapshot?.attendanceRules?.esslPunchInEnd);
            const punchOutStart = parseTime(snapshot?.attendanceRules?.esslPunchOutStart);
            const punchOutEnd = parseTime(snapshot?.attendanceRules?.esslPunchOutEnd);

            if (status === 0 && !isWithinWindow(logMinute, punchInStart, punchInEnd)) {
                console.log(`Punch-in ignored (outside ESSL punch-in window) for ${employeeDoc.empId} at ${formatMinutesToTime(logMinute)}`);

                await logEsslEvent({
                    companyId: whichCompany._id,
                    employeeId: employeeDoc._id,
                    empId: employeeDoc.empId,
                    employeeName: employeeDoc?.userid?.name,
                    event: `Punch-In Ignored: Outside Window (${snapshot?.attendanceRules?.esslPunchInStart} - ${snapshot?.attendanceRules?.esslPunchInEnd}) tried at ${formatMinutesToTime(logMinute)}`,
                    type: 'Ignored'
                });
                return res.send('OK');
            }

            if (status === 1 && !isWithinWindow(logMinute, punchOutStart, punchOutEnd)) {
                console.log(`Punch-out ignored (outside ESSL punch-out window) for ${employeeDoc.empId} at ${formatMinutesToTime(logMinute)}`);

                await logEsslEvent({
                    companyId: whichCompany._id,
                    employeeId: employeeDoc._id,
                    empId: employeeDoc.empId,
                    employeeName: employeeDoc?.userid?.name,
                    event: `Punch-Out Ignored: Outside Window (${snapshot?.attendanceRules?.esslPunchOutStart} - ${snapshot?.attendanceRules?.esslPunchOutEnd}) tried at ${formatMinutesToTime(logMinute)}`,
                    type: 'Ignored'
                });
                return res.send('OK');
            }


            // =========================
            // CHECK-IN
            // =========================
            if (!attendance) {
                if (status !== 0) {
                    console.log(`Punch-out ignored (no punch-in record) for ${employeeDoc.empId}`);
                    if (whichCompany.telegram.individualNotification && employeeDoc.telegramId) {
                        const message = `PUNCH IGNORED: ${employeeDoc?.userid?.name}, your Punch-Out at ${dayjs(punchDate).tz(ATTENDANCE_TIMEZONE).format("hh:mm A")} was ignored because no Punch-In record was found for today.`;
                        sendTelegramMessageseperate(whichCompany.telegram.token, employeeDoc.telegramId, message);
                    }
                    await logEsslEvent({
                        companyId: whichCompany._id,
                        employeeId: employeeDoc._id,
                        empId: employeeDoc.empId,
                        employeeName: employeeDoc?.userid?.name,
                        event: `Punch-Out Ignored: No Punch-In record found for today:${dayjs(punchDate).tz(ATTENDANCE_TIMEZONE).format("DD/MM/YY")} `,
                        type: 'Ignored'
                    });
                    return res.send('OK');
                }

                const earlyBefore = parseTime(snapshot?.attendanceRules?.considerEarlyEntryBefore);
                const lateAfter = parseTime(snapshot?.attendanceRules?.considerLateEntryAfter);

                const punchInMin = getMinutesInAttendanceTimezone(punchDate);

                let punchInStatus = "onTime";

                if (earlyBefore !== null && punchInMin < earlyBefore) {
                    punchInStatus = "early";
                } else if (lateAfter !== null && punchInMin > lateAfter) {
                    punchInStatus = "late";
                }

                attendance = new Attendance({
                    companyId: employeeDoc.companyId,
                    branchId: employeeDoc.branchId,
                    empId: employeeDoc.empId,
                    employeeId: employeeDoc._id,

                    date: dateObj,
                    status: 'present',
                    source: 'device',

                    punchIn: punchDate,
                    punchInStatus,

                    dutyStart: snapshot?.officeTime?.in,
                    dutyEnd: snapshot?.officeTime?.out,

                    rulesSnapshot: snapshot,

                    workingMinutes: 0,
                    overtimeMinutes: 0,
                    shortMinutes: 0
                });

                await attendance.save();

                await logEsslEvent({
                    companyId: whichCompany._id,
                    employeeId: employeeDoc._id,
                    empId: employeeDoc.empId,
                    employeeName: employeeDoc?.userid?.name,
                    event: `Punch-In Successful (New Record) at ${dayjs(punchDate).tz(ATTENDANCE_TIMEZONE).format("hh:mm A")} for ${dayjs(punchDate).tz(ATTENDANCE_TIMEZONE).format("DD/MM/YY")} `,
                    type: 'Success'
                });

                const updatedRecord = await Attendance.findById(attendance._id)
                    .populate({
                        path: 'employeeId',
                        select: 'userid profileimage',
                        populate: {
                            path: 'userid',
                            select: 'name'
                        }
                    });

                sendToClients(
                    {
                        type: 'attendance_update',
                        payload: { action: 'checkin', data: updatedRecord }
                    },
                    employeeDoc.companyId.toString(),
                    employeeDoc.branchId?.toString() || null
                );

                if (
                    whichCompany?.telegramNotifcation &&
                    whichCompany?.telegram?.token
                ) {
                    const message = `${updatedRecord?.employeeId?.userid?.name} has Punched In at ${dayjs(updatedRecord.punchIn)
                        .tz(ATTENDANCE_TIMEZONE)
                        .format("hh:mm A")}, Date-${dayjs(updatedRecord.punchIn)
                            .tz(ATTENDANCE_TIMEZONE)
                            .format("DD/MM/YY")}`;

                    if (whichCompany.telegram.groupId) {
                        sendTelegramMessageseperate(
                            whichCompany.telegram.token,
                            `-${whichCompany.telegram.groupId}`,
                            message
                        )
                    }

                    if (whichCompany.telegram.individualNotification && employeeDoc.telegramId) {
                        sendTelegramMessageseperate(
                            whichCompany.telegram.token,
                            employeeDoc.telegramId,
                            message
                        )
                    }
                }

            } else {
                // For explicit punch-in logs, never force checkout.
                if (status === 0) {
                    if (!attendance.punchIn) {
                        const earlyBefore = parseTime(snapshot?.attendanceRules?.considerEarlyEntryBefore);
                        const lateAfter = parseTime(snapshot?.attendanceRules?.considerLateEntryAfter);
                        const punchInMin = getMinutesInAttendanceTimezone(punchDate);

                        let punchInStatus = "onTime";
                        if (earlyBefore !== null && punchInMin < earlyBefore) punchInStatus = "early";
                        else if (lateAfter !== null && punchInMin > lateAfter) punchInStatus = "late";

                        attendance.punchIn = punchDate;
                        attendance.punchInStatus = punchInStatus;
                        attendance.status = 'present';
                        attendance.source = 'device';
                        attendance.rulesSnapshot = attendance.rulesSnapshot || snapshot;
                        attendance.dutyStart = attendance.dutyStart || snapshot?.officeTime?.in;
                        attendance.dutyEnd = attendance.dutyEnd || snapshot?.officeTime?.out;
                        await attendance.save();

                        await logEsslEvent({
                            companyId: whichCompany._id,
                            employeeId: employeeDoc._id,
                            empId: employeeDoc.empId,
                            employeeName: employeeDoc?.userid?.name,
                            event: `Punch-In Successful at ${dayjs(punchDate).tz(ATTENDANCE_TIMEZONE).format("hh:mm A")} for ${dayjs(punchDate).tz(ATTENDANCE_TIMEZONE).format("DD/MM/YY")} `,
                            type: 'Success'
                        });
                    } else {
                        // console.log(`Extra punch-in ignored for ${employeeDoc.empId}`);
                        console.log(`Extra punch-in ignored for ${employeeDoc.empId}`);
                        if (whichCompany.telegram.individualNotification && employeeDoc.telegramId) {

                            const time = dayjs(punchDate)
                                .tz(ATTENDANCE_TIMEZONE)
                                .format("hh:mm A");

                            const date = dayjs(punchDate)
                                .tz(ATTENDANCE_TIMEZONE)
                                .format("DD MMM YYYY"); // e.g. 18 Apr 2026

                            const message = `⚠️ EXTRA PUNCH

${employeeDoc?.userid?.name}, your Punch-In at ${time} on ${date} was ignored because you are already punched in.`;

                            sendTelegramMessageseperate(
                                whichCompany.telegram.token,
                                employeeDoc.telegramId,
                                message
                            );
                        }
                        await logEsslEvent({
                            companyId: whichCompany._id,
                            employeeId: employeeDoc._id,
                            empId: employeeDoc.empId,
                            employeeName: employeeDoc?.userid?.name,
                            event: `Extra Punch-In Ignored: Already Punched In for ${dayjs(punchDate).tz(ATTENDANCE_TIMEZONE).format("DD MMM YYYY")}`,
                            type: 'Ignored'
                        });
                    }
                    return res.send('OK');
                }

                // =========================
                // CHECK-OUT (status = 1)
                // =========================
                if (!attendance.punchIn) {
                    console.log(`Punch-out ignored (missing punch-in) for ${employeeDoc.empId}`);
                    if (whichCompany.telegram.individualNotification && employeeDoc.telegramId) {
                        const message = `PUNCH IGNORED: ${employeeDoc?.userid?.name}, your Punch-Out at ${dayjs(punchDate).tz(ATTENDANCE_TIMEZONE).format("hh:mm A")} was ignored because no Punch-In record was found.`;
                        sendTelegramMessageseperate(whichCompany.telegram.token, employeeDoc.telegramId, message);
                    }
                    await logEsslEvent({
                        companyId: whichCompany._id,
                        employeeId: employeeDoc._id,
                        empId: employeeDoc.empId,
                        employeeName: employeeDoc?.userid?.name,
                        event: `Punch-Out Ignored: Missing Punch-In record for ${dayjs(punchDate).tz(ATTENDANCE_TIMEZONE).format("DD MMM YYYY")}`,
                        type: 'Ignored'
                    });
                    return res.send('OK');
                }

                if (!attendance.punchOut) {

                    attendance.punchOut = punchDate;

                    await calculateStats(attendance, companyData, branch);
                    await attendance.save();

                    await logEsslEvent({
                        companyId: whichCompany._id,
                        employeeId: employeeDoc._id,
                        empId: employeeDoc.empId,
                        employeeName: employeeDoc?.userid?.name,
                        event: `Punch-Out Successful at ${dayjs(punchDate).tz(ATTENDANCE_TIMEZONE).format("hh:mm A")} for ${dayjs(punchDate).tz(ATTENDANCE_TIMEZONE).format("DD/MM/YY")} `,
                        type: 'Success'
                    });



                    const updatedRecord = await Attendance.findById(attendance._id)
                        .populate({
                            path: 'employeeId',
                            select: 'userid profileimage',
                            populate: {
                                path: 'userid',
                                select: 'name'
                            }
                        });

                    sendToClients(
                        {
                            type: 'attendance_update',
                            payload: { action: 'checkOut', data: updatedRecord }
                        },
                        employeeDoc.companyId.toString(),
                        employeeDoc.branchId?.toString() || null
                    );


                    if (
                        whichCompany?.telegramNotifcation &&
                        whichCompany?.telegram?.token
                    ) {
                        const message = `${updatedRecord?.employeeId?.userid?.name} has Punched Out at ${dayjs(updatedRecord.punchOut)
                            .tz(ATTENDANCE_TIMEZONE)
                            .format("hh:mm A")}, Date-${dayjs(updatedRecord.punchOut)
                                .tz(ATTENDANCE_TIMEZONE)
                                .format("DD/MM/YY")}`;

                        if (whichCompany.telegram.groupId) {
                            sendTelegramMessageseperate(
                                whichCompany.telegram.token,
                                `-${whichCompany.telegram.groupId}`,
                                message
                            )
                        }

                        if (whichCompany.telegram.individualNotification && employeeDoc.telegramId) {
                            sendTelegramMessageseperate(
                                whichCompany.telegram.token,
                                employeeDoc.telegramId,
                                message
                            )
                        }
                    }

                } else {
                    console.log(`Extra punch ignored for ${employeeDoc.empId}`);
                    if (whichCompany.telegram.individualNotification && employeeDoc.telegramId) {

                        const time = dayjs(punchDate)
                            .tz(ATTENDANCE_TIMEZONE)
                            .format("hh:mm A");

                        const date = dayjs(punchDate)
                            .tz(ATTENDANCE_TIMEZONE)
                            .format("DD MMM YYYY"); // e.g. 18 Apr 2026

                        const message = `⚠️ EXTRA PUNCH-Out
 ${employeeDoc?.userid?.name}, your Punch-Out at ${time} on ${date} was ignored because you are already punched Out.`;

                        sendTelegramMessageseperate(whichCompany.telegram.token, employeeDoc.telegramId, message);
                    }
                    await logEsslEvent({
                        companyId: whichCompany._id,
                        employeeId: employeeDoc._id,
                        empId: employeeDoc.empId,
                        employeeName: employeeDoc?.userid?.name,
                        event: `Extra Punch-Out Ignored: Already Punched Out for ${dayjs(punchDate)
                            .tz(ATTENDANCE_TIMEZONE)
                            .format("DD MMM YYYY")}`,
                        type: 'Ignored'
                    });
                }
            }
        }

        return res.send('OK');

    } catch (error) {
        console.error("ESSL ERROR:", error);
        return res.send('OK');
    }
});

router.get('/api/getEsslEvents/:companyId', async (req, res) => {
    try {
        const events = await EsslEvent.find({ companyId: req.params.companyId })
            .sort({ createdAt: -1 })
            .limit(20);
        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching ESSL events:', error);
        res.status(500).json({ message: 'Error fetching ESSL events' });
    }
});

module.exports = router;
