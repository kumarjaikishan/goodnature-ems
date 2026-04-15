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

// POST request for device
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

            console.log('⏱ Live Attendance:', attendancee);


            const status = parseInt(attendancee.Status, 10);

            // Only allow punchIn (0) and punchOut (1)
            if (status > 1) return res.send('OK');

            const deviceUserId = attendancee.PIN;
            const recordTime = attendancee.Timestamp;

            // =========================
            // NORMALIZE TIME
            // =========================
            const punchDate = new Date(recordTime);
            if (isNaN(punchDate)) {
                console.warn("Invalid date:", recordTime);
                return res.send('OK');
            }
            punchDate.setSeconds(0, 0);

            const dateObj = new Date(Date.UTC(
                punchDate.getUTCFullYear(),
                punchDate.getUTCMonth(),
                punchDate.getUTCDate()
            ));

            // =========================
            // FIND COMPANY
            // =========================
            const whichCompany = await company.findOne({ "devices.SN": deviceSN }).select('_id telegram telegramNotifcation');


            if (!whichCompany) {
                console.warn(`No company for SN ${deviceSN}`);
                return res.send('OK');
            }

            // manual telegram notoifcation off
            whichCompany.telegramNotifcation = false;

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
            }).select('_id branchId empId companyId');

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
            const IST_OFFSET_MS = 330 * 60 * 1000;

            const getMinutes = (date) => {
                const istDate = new Date(date.getTime() + IST_OFFSET_MS);
                return istDate.getUTCHours() * 60 + istDate.getUTCMinutes();
            };

            const parseTime = (t) => {
                if (!t) return null;
                const [h, m] = t.split(':').map(Number);
                return h * 60 + m;
            };

            // =========================
            // CHECK-IN
            // =========================
            if (!attendance) {

                const earlyBefore = parseTime(snapshot?.attendanceRules?.considerEarlyEntryBefore);
                const lateAfter = parseTime(snapshot?.attendanceRules?.considerLateEntryAfter);

                const punchInMin = getMinutes(punchDate);

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
                    whichCompany?.telegram?.token &&
                    whichCompany?.telegram?.groupId
                ) {
                    sendTelegramMessageseperate(
                        whichCompany.telegram.token,
                        whichCompany.telegram.groupId,
                        `${updatedRecord?.employeeId?.userid?.name} has Punched In at ${dayjs(updatedRecord.punchIn)
                            .utc()
                            .add(5, 'hours')
                            .add(30, 'minutes')
                            .format("hh:mm A")}, Date-${dayjs(updatedRecord.punchIn)
                                .utc()
                                .add(5, 'hours')
                                .add(30, 'minutes')
                                .format("DD/MM/YY")}`
                    )
                }

            } else {

                // =========================
                // CHECK-OUT
                // =========================
                if (!attendance.punchOut) {

                    attendance.punchOut = punchDate;

                    const expectedMinutes = attendance?.rulesSnapshot?.workingMinutes?.fullDay || 480;

                    const diffMinutes = (attendance.punchOut - attendance.punchIn) / (1000 * 60);
                    attendance.workingMinutes = parseFloat(diffMinutes.toFixed(2));

                    const short = expectedMinutes - attendance.workingMinutes;
                    attendance.shortMinutes = short > 0 ? parseFloat(short.toFixed(2)) : 0;

                    const overtime = attendance.workingMinutes - expectedMinutes;
                    attendance.overtimeMinutes = overtime > 0 ? parseFloat(overtime.toFixed(2)) : 0;

                    // ✅ punchOutStatus
                    const earlyExit = parseTime(attendance?.rulesSnapshot?.attendanceRules?.considerEarlyExitBefore);
                    const lateExit = parseTime(attendance?.rulesSnapshot?.attendanceRules?.considerLateExitAfter);

                    const punchOutMin = getMinutes(punchDate);

                    let punchOutStatus = "onTime";

                    if (earlyExit !== null && punchOutMin < earlyExit) {
                        punchOutStatus = "early";
                    } else if (lateExit !== null && punchOutMin > lateExit) {
                        punchOutStatus = "late";
                    }

                    attendance.punchOutStatus = punchOutStatus;

                    await attendance.save();

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
                        whichCompany?.telegram?.token &&
                        whichCompany?.telegram?.groupId
                    ) {
                        sendTelegramMessageseperate(
                            whichCompany.telegram.token,
                            whichCompany.telegram.groupId,
                            `${updatedRecord?.employeeId?.userid?.name} has Punched Out at ${dayjs(updatedRecord.punchOut)
                                .utc()
                                .add(5, 'hours')
                                .add(30, 'minutes')
                                .format("hh:mm A")}, Date-${dayjs(updatedRecord.punchOut)
                                    .utc()
                                    .add(5, 'hours')
                                    .add(30, 'minutes')
                                    .format("DD/MM/YY")}`
                        )
                    }

                } else {
                    console.log(`Extra punch ignored for ${employeeDoc.empId}`);
                }
            }
        }

        return res.send('OK');

    } catch (error) {
        console.error("ESSL ERROR:", error);
        return res.send('OK');
    }
});

module.exports = router;
