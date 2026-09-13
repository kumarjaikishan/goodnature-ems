/**
 * Database Seed Script for Good Nature EMS
 * ─────────────────────────────────────────────────────────────────────────────
 * • 6 Multi-Parcel Kisan Land Agreements & Ledgers
 * • 2 Direct Company Sponsors (Business Partners) & 5 Sub-Sponsors (Promoters)
 * • 10 Customers (2 Direct Company Customers, 8 under Sub-Sponsors)
 * • 4 Plot Series Masters (E, A, D, C) with all plots AVAILABLE
 * • ZERO bookings or collections (cleans up any existing bookings/receipts/closings)
 * ─────────────────────────────────────────────────────────────────────────────
 * Usage: node server/scripts/seed.js (or npm run seed from server/)
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

// Import Models
const PlotSeriesMaster = require('../models/PlotSeriesMaster');
const Plot = require('../models/Plot');
const PlotCustomer = require('../models/PlotCustomer');
const User = require('../models/user');
const KisanLandAgreement = require('../models/KisanLandAgreement');
const KisanLedger = require('../models/KisanLedger');
const LandStockLedger = require('../models/LandStockLedger');
const PlotBooking = require('../models/PlotBooking');
const PlotPayment = require('../models/PlotPayment');
const PlotReceipt = require('../models/PlotReceipt');
const PlotInstallment = require('../models/PlotInstallment');
const PlotPayoutSchedule = require('../models/PlotPayoutSchedule');
const PlotPayoutVoucher = require('../models/PlotPayoutVoucher');
const PlotSponsorCommission = require('../models/PlotSponsorCommission');
const PlotClosing = require('../models/PlotClosing');
const Counter = require('../models/Counter');

const DB_URI = process.env.db;

async function seed() {
  console.log('🚀 Starting Good Nature EMS Clean Seed Script...');
  console.log('📡 Connecting to MongoDB:', DB_URI);
  await mongoose.connect(DB_URI);
  console.log('✅ Connected to MongoDB successfully.\n');

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 1: DROP / CLEAN OLD RELEVANT TEST DATA (INCLUDING ALL BOOKINGS & COLLECTIONS)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('🧹 Cleaning previous plots, kisan agreements, bookings, collections, receipts, and closings...');
  await Promise.all([
    PlotSeriesMaster.deleteMany({}),
    Plot.deleteMany({}),
    PlotCustomer.deleteMany({}),
    KisanLandAgreement.deleteMany({}),
    KisanLedger.deleteMany({}),
    LandStockLedger.deleteMany({}),
    PlotBooking.deleteMany({}),
    PlotPayment.deleteMany({}),
    PlotReceipt.deleteMany({}),
    PlotInstallment.deleteMany({}),
    PlotPayoutSchedule.deleteMany({}),
    PlotPayoutVoucher.deleteMany({}),
    PlotSponsorCommission.deleteMany({}),
    PlotClosing.deleteMany({}),
    // Clean old seed sponsor users to avoid duplicates
    User.deleteMany({
      email: {
        $in: [
          'sponsor.ravi@goodnature.com',
          'sponsor.priya@goodnature.com',
          'sponsor.manoj@goodnature.com',
          'sponsor.amit@goodnature.com',
          'sponsor.sneha@goodnature.com',
          'sponsor.vikash@goodnature.com',
          'sponsor.pooja@goodnature.com',
        ],
      },
    }),
    Counter.deleteMany({
      _id: {
        $in: [
          'plotBookingReceipt',
          'plotAgreement',
          'plotClosing',
          'plotBooking',
          'kisanAgreement',
          'kisanPaymentReceipt',
          'plotCustomer',
        ],
      },
    }),
  ]);
  console.log('✅ Previous collections and booking data completely cleared.\n');

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 2: CREATE SPONSORS (2 DIRECT BUSINESS PARTNERS & 5 BUSINESS ASSOCIATES)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('👥 Creating Sponsors (2 Business Partners & 5 Business Associates)...');

  // 2 Direct Company Sponsors (Business Partners - sponsorId: null)
  const directSponsor1 = await User.create({
    name: 'Ravi Kumar',
    email: 'sponsor.ravi@goodnature.com',
    password: 'password123',
    role: 'sponsor',
    sponsorCode: 'SP-1001',
    mobile: '9876543201',
    sponsorId: null, // Direct Company Partner
  });

  const directSponsor2 = await User.create({
    name: 'Priya Singh',
    email: 'sponsor.priya@goodnature.com',
    password: 'password123',
    role: 'sponsor',
    sponsorCode: 'SP-1002',
    mobile: '9876543202',
    sponsorId: null, // Direct Company Partner
  });

  // 5 Sub Sponsors (Business Associates under the 2 Business Partners)
  const subSponsor1 = await User.create({
    name: 'Manoj Gupta',
    email: 'sponsor.manoj@goodnature.com',
    password: 'password123',
    role: 'sponsor',
    sponsorCode: 'SP-2001',
    mobile: '9876543203',
    sponsorId: directSponsor1._id, // Under Ravi Kumar
  });

  const subSponsor2 = await User.create({
    name: 'Amit Sinha',
    email: 'sponsor.amit@goodnature.com',
    password: 'password123',
    role: 'sponsor',
    sponsorCode: 'SP-2002',
    mobile: '9876543204',
    sponsorId: directSponsor1._id, // Under Ravi Kumar
  });

  const subSponsor3 = await User.create({
    name: 'Sneha Raj',
    email: 'sponsor.sneha@goodnature.com',
    password: 'password123',
    role: 'sponsor',
    sponsorCode: 'SP-2003',
    mobile: '9876543205',
    sponsorId: directSponsor1._id, // Under Ravi Kumar
  });

  const subSponsor4 = await User.create({
    name: 'Vikash Sharma',
    email: 'sponsor.vikash@goodnature.com',
    password: 'password123',
    role: 'sponsor',
    sponsorCode: 'SP-2004',
    mobile: '9876543206',
    sponsorId: directSponsor2._id, // Under Priya Singh
  });

  const subSponsor5 = await User.create({
    name: 'Pooja Verma',
    email: 'sponsor.pooja@goodnature.com',
    password: 'password123',
    role: 'sponsor',
    sponsorCode: 'SP-2005',
    mobile: '9876543207',
    sponsorId: directSponsor2._id, // Under Priya Singh
  });

  console.log('  ✓ 2 Business Partners created:');
  console.log(`    1. ${directSponsor1.name} (Business Partner) (${directSponsor1.sponsorCode})`);
  console.log(`    2. ${directSponsor2.name} (Business Partner) (${directSponsor2.sponsorCode})`);
  console.log('  ✓ 5 Business Associates created:');
  console.log(`    1. ${subSponsor1.name} (Business Associate) (${subSponsor1.sponsorCode}) -> under ${directSponsor1.name}`);
  console.log(`    2. ${subSponsor2.name} (Business Associate) (${subSponsor2.sponsorCode}) -> under ${directSponsor1.name}`);
  console.log(`    3. ${subSponsor3.name} (Business Associate) (${subSponsor3.sponsorCode}) -> under ${directSponsor1.name}`);
  console.log(`    4. ${subSponsor4.name} (Business Associate) (${subSponsor4.sponsorCode}) -> under ${directSponsor2.name}`);
  console.log(`    5. ${subSponsor5.name} (Business Associate) (${subSponsor5.sponsorCode}) -> under ${directSponsor2.name}\n`);

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 3: CREATE EXACTLY 10 CUSTOMERS (2 DIRECT, 8 UNDER SUB-SPONSORS)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('👤 Creating Exactly 10 Customers (2 Direct, 8 under Sub-Sponsors)...');

  const customersData = [
    // 2 Direct Company Customers (sponsorId: null)
    {
      customerId: 'CUST-001',
      name: 'Suresh Verma',
      mobile: '9835012345',
      email: 'suresh.verma@example.com',
      address: 'House No 12, Boring Road, Patna',
      city: 'Patna',
      state: 'Bihar',
      pincode: '800001',
      fatherOrHusbandName: 'Late Brijesh Verma',
      gender: 'Male',
      occupation: 'Government Employee',
      nomineeName: 'Poonam Verma',
      nomineeRelation: 'Wife',
      sponsorId: null, // Direct Company Customer
    },
    {
      customerId: 'CUST-002',
      name: 'Rajesh Mishra',
      mobile: '9835054321',
      email: 'rajesh.mishra@example.com',
      address: 'Flat 302, Green Enclave, Danapur',
      city: 'Patna',
      state: 'Bihar',
      pincode: '801503',
      fatherOrHusbandName: 'Satish Mishra',
      gender: 'Male',
      occupation: 'Business',
      nomineeName: 'Pooja Mishra',
      nomineeRelation: 'Wife',
      sponsorId: null, // Direct Company Customer
    },

    // 8 Sub-Sponsor Customers
    {
      customerId: 'CUST-003',
      name: 'Sunita Devi',
      mobile: '9431098765',
      email: 'sunita.devi@example.com',
      address: 'Main Road, Bihta Chowk',
      city: 'Patna',
      state: 'Bihar',
      pincode: '801103',
      fatherOrHusbandName: 'Mahendra Prasad',
      gender: 'Female',
      occupation: 'Housewife',
      nomineeName: 'Mahendra Prasad',
      nomineeRelation: 'Husband',
      sponsorId: subSponsor1._id, // under Manoj Gupta (SP-2001)
    },
    {
      customerId: 'CUST-004',
      name: 'Vikram Patel',
      mobile: '9122045678',
      email: 'vikram.patel@example.com',
      address: 'Station Road, Phulwari Sharif',
      city: 'Patna',
      state: 'Bihar',
      pincode: '801505',
      fatherOrHusbandName: 'Kishore Patel',
      gender: 'Male',
      occupation: 'Doctor',
      nomineeName: 'Geeta Patel',
      nomineeRelation: 'Wife',
      sponsorId: subSponsor1._id, // under Manoj Gupta (SP-2001)
    },
    {
      customerId: 'CUST-005',
      name: 'Anjali Sharma',
      mobile: '9334067890',
      email: 'anjali.sharma@example.com',
      address: 'Kankarbagh Colony, Patna',
      city: 'Patna',
      state: 'Bihar',
      pincode: '800020',
      fatherOrHusbandName: 'Rohit Sharma',
      gender: 'Female',
      occupation: 'Teacher',
      nomineeName: 'Rohit Sharma',
      nomineeRelation: 'Husband',
      sponsorId: subSponsor2._id, // under Amit Sinha (SP-2002)
    },
    {
      customerId: 'CUST-006',
      name: 'Deepak Kumar Singh',
      mobile: '9835123987',
      email: 'deepak.singh@example.com',
      address: 'Sector 4, Ashiana Nagar, Patna',
      city: 'Patna',
      state: 'Bihar',
      pincode: '800025',
      fatherOrHusbandName: 'Ramakant Singh',
      gender: 'Male',
      occupation: 'IT Professional',
      nomineeName: 'Shalini Singh',
      nomineeRelation: 'Wife',
      sponsorId: subSponsor2._id, // under Amit Sinha (SP-2002)
    },
    {
      customerId: 'CUST-007',
      name: 'Manish Kumar Jha',
      mobile: '9470123456',
      email: 'manish.jha@example.com',
      address: 'Near Gandhi Murti, Khagaul Road, Danapur',
      city: 'Patna',
      state: 'Bihar',
      pincode: '801105',
      fatherOrHusbandName: 'K. N. Jha',
      gender: 'Male',
      occupation: 'Banker',
      nomineeName: 'Kavita Jha',
      nomineeRelation: 'Wife',
      sponsorId: subSponsor3._id, // under Sneha Raj (SP-2003)
    },
    {
      customerId: 'CUST-008',
      name: 'Pooja Kumari',
      mobile: '9123456781',
      email: 'pooja.kumari@example.com',
      address: 'New Bailey Road, Rukanpura, Patna',
      city: 'Patna',
      state: 'Bihar',
      pincode: '800014',
      fatherOrHusbandName: 'Vinod Kumar',
      gender: 'Female',
      occupation: 'Chartered Accountant',
      nomineeName: 'Vinod Kumar',
      nomineeRelation: 'Father',
      sponsorId: subSponsor4._id, // under Vikash Sharma (SP-2004)
    },
    {
      customerId: 'CUST-009',
      name: 'Arun Kumar Choudhary',
      mobile: '9934567890',
      email: 'arun.choudhary@example.com',
      address: 'Bikram Road, Naubatpur',
      city: 'Patna',
      state: 'Bihar',
      pincode: '801109',
      fatherOrHusbandName: 'Late S. K. Choudhary',
      gender: 'Male',
      occupation: 'Civil Contractor',
      nomineeName: 'Anita Choudhary',
      nomineeRelation: 'Wife',
      sponsorId: subSponsor4._id, // under Vikash Sharma (SP-2004)
    },
    {
      customerId: 'CUST-010',
      name: 'Ritu Raj',
      mobile: '9708912345',
      email: 'rituraj.patna@example.com',
      address: 'Patliputra Colony, Patna',
      city: 'Patna',
      state: 'Bihar',
      pincode: '800013',
      fatherOrHusbandName: 'Hemant Raj',
      gender: 'Female',
      occupation: 'Lawyer',
      nomineeName: 'Hemant Raj',
      nomineeRelation: 'Husband',
      sponsorId: subSponsor5._id, // under Pooja Verma (SP-2005)
    },
  ];

  const createdCustomers = await PlotCustomer.insertMany(customersData);
  console.log(`  ✓ Successfully created ${createdCustomers.length} Customers (2 Direct, 8 under Sub-Sponsors).\n`);

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 4: CREATE PLOT SERIES MASTERS & PLOTS (ALL INITIALIZED AS AVAILABLE)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('🏗️ Creating Plot Series Masters and Plots (All status = AVAILABLE)...');

  // 1. E Series: 11 plots, 800 sqft (20 x 40)
  const seriesE = await PlotSeriesMaster.create({
    name: 'E-Block (Residential Plots)',
    prefix: 'E',
    startNumber: 1,
    endNumber: 11,
    plotArea: 800,
    defaultPlotType: 'NORMAL',
    numberFormat: 'A000',
    defaultDimensions: { north: 40, south: 40, east: 20, west: 20 },
    defaultBoundaries: {
      north: 'Road 20ft Wide',
      south: 'Other Plot Boundary',
      east: 'Adjacent Plot',
      west: 'Adjacent Plot',
    },
    remarks: 'E-Block standard 800 sqft residential plots (20x40 ft)',
    status: 'active',
  });

  const plotsE = [];
  for (let i = 1; i <= 11; i++) {
    const numStr = String(i).padStart(3, '0');
    plotsE.push({
      plotNumber: `E-${numStr}`,
      seriesId: seriesE._id,
      sequenceNumber: i,
      plotSize: 800,
      plotType: i === 1 || i === 11 ? 'CORNER' : 'NORMAL',
      baseRate: 1000,
      effectiveRate: 1000,
      totalPlotValue: 800000,
      status: 'AVAILABLE',
      dimensions: { north: 40, south: 40, east: 20, west: 20 },
      boundaries: {
        north: 'Road 20ft Wide',
        south: 'Plot Boundary',
        east: i === 11 ? 'Corner Road 25ft' : `Plot E-${String(i + 1).padStart(3, '0')}`,
        west: i === 1 ? 'Corner Road 25ft' : `Plot E-${String(i - 1).padStart(3, '0')}`,
      },
      remarks: `E-Series Plot ${i} (800 SqFt, 20x40)`,
    });
  }
  const createdPlotsE = await Plot.insertMany(plotsE);
  console.log(`  ✓ Created Series E with ${createdPlotsE.length} plots (E-001 to E-011, AVAILABLE).`);

  // 2. A Series: 10 plots, 2400 sqft (40 x 60)
  const seriesA = await PlotSeriesMaster.create({
    name: 'A-Block (Luxury Villa Plots)',
    prefix: 'A',
    startNumber: 1,
    endNumber: 10,
    plotArea: 2400,
    defaultPlotType: 'NORMAL',
    numberFormat: 'A000',
    defaultDimensions: { north: 60, south: 60, east: 40, west: 40 },
    defaultBoundaries: {
      north: 'Main Boulevard 40ft',
      south: 'Green Belt',
      east: 'Adjacent Plot',
      west: 'Adjacent Plot',
    },
    remarks: 'A-Block luxury villa plots 2400 sqft (40x60 ft)',
    status: 'active',
  });

  const plotsA = [];
  for (let i = 1; i <= 10; i++) {
    const numStr = String(i).padStart(3, '0');
    plotsA.push({
      plotNumber: `A-${numStr}`,
      seriesId: seriesA._id,
      sequenceNumber: i,
      plotSize: 2400,
      plotType: i === 1 || i === 10 ? 'CORNER' : 'NORMAL',
      baseRate: 1200,
      effectiveRate: 1200,
      totalPlotValue: 2880000,
      status: 'AVAILABLE',
      dimensions: { north: 60, south: 60, east: 40, west: 40 },
      boundaries: {
        north: 'Main Boulevard 40ft',
        south: 'Green Belt / Park',
        east: i === 10 ? 'Side Avenue' : `Plot A-${String(i + 1).padStart(3, '0')}`,
        west: i === 1 ? 'Side Avenue' : `Plot A-${String(i - 1).padStart(3, '0')}`,
      },
      remarks: `A-Series Plot ${i} (2400 SqFt, 40x60)`,
    });
  }
  const createdPlotsA = await Plot.insertMany(plotsA);
  console.log(`  ✓ Created Series A with ${createdPlotsA.length} plots (A-001 to A-010, AVAILABLE).`);

  // 3. D Series: 10 plots, 1600 sqft (40 x 40)
  const seriesD = await PlotSeriesMaster.create({
    name: 'D-Block (Commercial / Premium Plots)',
    prefix: 'D',
    startNumber: 1,
    endNumber: 10,
    plotArea: 1600,
    defaultPlotType: 'NORMAL',
    numberFormat: 'A000',
    defaultDimensions: { north: 40, south: 40, east: 40, west: 40 },
    defaultBoundaries: {
      north: 'Commercial Road 30ft',
      south: 'Service Lane',
      east: 'Adjacent Plot',
      west: 'Adjacent Plot',
    },
    remarks: 'D-Block 1600 sqft commercial/premium plots (40x40 ft)',
    status: 'active',
  });

  const plotsD = [];
  for (let i = 1; i <= 10; i++) {
    const numStr = String(i).padStart(3, '0');
    plotsD.push({
      plotNumber: `D-${numStr}`,
      seriesId: seriesD._id,
      sequenceNumber: i,
      plotSize: 1600,
      plotType: i === 1 || i === 10 ? 'CORNER' : 'NORMAL',
      baseRate: 1100,
      effectiveRate: 1100,
      totalPlotValue: 1760000,
      status: 'AVAILABLE',
      dimensions: { north: 40, south: 40, east: 40, west: 40 },
      boundaries: {
        north: 'Commercial Road 30ft',
        south: 'Service Lane',
        east: i === 10 ? 'Sector Road' : `Plot D-${String(i + 1).padStart(3, '0')}`,
        west: i === 1 ? 'Sector Road' : `Plot D-${String(i - 1).padStart(3, '0')}`,
      },
      remarks: `D-Series Plot ${i} (1600 SqFt, 40x40)`,
    });
  }
  const createdPlotsD = await Plot.insertMany(plotsD);
  console.log(`  ✓ Created Series D with ${createdPlotsD.length} plots (D-001 to D-010, AVAILABLE).`);

  // 4. C Series: 10 plots, 1200 sqft (30 x 40)
  const seriesC = await PlotSeriesMaster.create({
    name: 'C-Block (Standard Residential Plots)',
    prefix: 'C',
    startNumber: 1,
    endNumber: 10,
    plotArea: 1200,
    defaultPlotType: 'NORMAL',
    numberFormat: 'A000',
    defaultDimensions: { north: 40, south: 40, east: 30, west: 30 },
    defaultBoundaries: {
      north: 'Sector Road 25ft',
      south: 'Rear Plot Line',
      east: 'Adjacent Plot',
      west: 'Adjacent Plot',
    },
    remarks: 'C-Block 1200 sqft residential plots (30x40 ft)',
    status: 'active',
  });

  const plotsC = [];
  for (let i = 1; i <= 10; i++) {
    const numStr = String(i).padStart(3, '0');
    plotsC.push({
      plotNumber: `C-${numStr}`,
      seriesId: seriesC._id,
      sequenceNumber: i,
      plotSize: 1200,
      plotType: i === 1 || i === 10 ? 'CORNER' : 'NORMAL',
      baseRate: 1000,
      effectiveRate: 1000,
      totalPlotValue: 1200000,
      status: 'AVAILABLE',
      dimensions: { north: 40, south: 40, east: 30, west: 30 },
      boundaries: {
        north: 'Sector Road 25ft',
        south: 'Rear Plot Line',
        east: i === 10 ? 'Corner 30ft Road' : `Plot C-${String(i + 1).padStart(3, '0')}`,
        west: i === 1 ? 'Corner 30ft Road' : `Plot C-${String(i - 1).padStart(3, '0')}`,
      },
      remarks: `C-Series Plot ${i} (1200 SqFt, 30x40)`,
    });
  }
  const createdPlotsC = await Plot.insertMany(plotsC);
  console.log(`  ✓ Created Series C with ${createdPlotsC.length} plots (C-001 to C-010, AVAILABLE).\n`);

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 5: CREATE EXACTLY 6 KISAN LAND AGREEMENTS, DEEDS & LEDGERS
  // ───────────────────────────────────────────────────────────────────────────
  console.log('🌾 Creating Exactly 6 Multi-Parcel Kisan Land Agreements & Ledgers...');

  // Agreement 1: Danapur & Bihta Multi-Parcel (AGR-2425-001)
  const p1_dismil = 15.5;
  const p1_sqft = Math.round(p1_dismil * 435.6 * 100) / 100;
  const p1_reg_dismil = 10.0;
  const p1_reg_sqft = Math.round(p1_reg_dismil * 435.6 * 100) / 100;

  const p2_dismil = 10.0;
  const p2_sqft = Math.round(p2_dismil * 435.6 * 100) / 100;

  const p3_dismil = 25.0;
  const p3_sqft = Math.round(p3_dismil * 435.6 * 100) / 100;

  const agr1_total_dismil = p1_dismil + p2_dismil + p3_dismil; // 50.5
  const agr1_total_sqft = Math.round(agr1_total_dismil * 435.6 * 100) / 100; // 21997.8
  const agr1_total_cost = 775000 + 500000 + 1125000; // 2400000

  const agr1 = new KisanLandAgreement({
    agreementNumber: 'AGR-2425-001',
    agreementDate: new Date('2024-04-10'),
    agreementEndDate: new Date('2024-10-10'),
    araziDismil: agr1_total_dismil,
    totalSqFt: agr1_total_sqft,
    ratePerDismil: 47524,
    ratePerSqFt: 109.1,
    totalAgreementAmount: agr1_total_cost,
    remarks: 'Acquired via Danapur circle. 3 land parcels with 1 converted registry deed.',
    status: 'PARTIALLY_REGISTERED',
    landParcels: [
      {
        mauja: 'Rampur',
        khataNumber: '104',
        khesraNumber: '582',
        thanaNumber: '12',
        jamabandiNumber: 'JB-101',
        chaudhi: {
          north: 'Road 25ft Wide',
          south: 'Plot 583 (Mohan Lal)',
          east: 'Canal Line',
          west: 'Rameshwar Sah Land',
        },
        araziDismil: p1_dismil,
        totalSqFt: p1_sqft,
        ratePerDismil: 50000,
        ratePerSqFt: 114.78,
        totalAmount: 775000,
        registeredDismil: p1_reg_dismil,
        registeredSqFt: p1_reg_sqft,
        unregisteredAgreedSqFt: p1_sqft - p1_reg_sqft,
        unregisteredAvailableSqFt: p1_sqft - p1_reg_sqft,
        allocatedSqFt: 0,
        availableSqFt: p1_reg_sqft,
        remarks: '10 Dismil registered under DEED-2024-9812; 5.5 Dismil remains in agreement pool.',
      },
      {
        mauja: 'Rampur',
        khataNumber: '104',
        khesraNumber: '585',
        thanaNumber: '12',
        jamabandiNumber: 'JB-102',
        chaudhi: {
          north: 'Plot 582',
          south: 'Main Paved Road',
          east: 'Government Boundary',
          west: 'Self Land',
        },
        araziDismil: p2_dismil,
        totalSqFt: p2_sqft,
        ratePerDismil: 50000,
        ratePerSqFt: 114.78,
        totalAmount: 500000,
        registeredDismil: 0,
        registeredSqFt: 0,
        unregisteredAgreedSqFt: p2_sqft,
        unregisteredAvailableSqFt: p2_sqft,
        allocatedSqFt: 0,
        availableSqFt: 0,
      },
      {
        mauja: 'Maner',
        khataNumber: '210',
        khesraNumber: '891',
        thanaNumber: '45',
        jamabandiNumber: 'JB-205',
        chaudhi: {
          north: 'Plot 890 (Kailash Mahto)',
          south: 'Village Road 20ft',
          east: 'Bikram Minor Canal',
          west: 'Self Boundary',
        },
        araziDismil: p3_dismil,
        totalSqFt: p3_sqft,
        ratePerDismil: 45000,
        ratePerSqFt: 103.3,
        totalAmount: 1125000,
        registeredDismil: 0,
        registeredSqFt: 0,
        unregisteredAgreedSqFt: p3_sqft,
        unregisteredAvailableSqFt: p3_sqft,
        allocatedSqFt: 0,
        availableSqFt: 0,
      },
    ],
    farmers: [
      {
        name: 'Ram Prasad Yadav',
        guardianName: 'Late Mohan Yadav',
        relation: 'Father',
        mobile: '9876543210',
        aadhaarNumber: '234567890123',
        panNumber: 'ABCPY1234F',
        sharePercent: 70,
        address: 'Vill- Rampur, PO- Danapur, Dist- Patna',
      },
      {
        name: 'Sita Devi',
        guardianName: 'Ram Prasad Yadav',
        relation: 'Husband',
        mobile: '9876543211',
        aadhaarNumber: '345678901234',
        panNumber: 'BCDPY5678G',
        sharePercent: 30,
        address: 'Vill- Rampur, PO- Danapur, Dist- Patna',
      },
    ],
    attachments: [
      {
        fileName: 'Agreement_Copy_RamPrasad',
        fileType: 'Agreement Scan',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/sample_agreement.pdf',
        fileSize: 1048576,
        description: 'Original signed stamp agreement copy',
      },
    ],
    totalRegisteredDismil: p1_reg_dismil,
    totalRegisteredSqFt: p1_reg_sqft,
    unregisteredAgreedSqFt: agr1_total_sqft - p1_reg_sqft,
    unregisteredAvailableSqFt: agr1_total_sqft - p1_reg_sqft,
    totalAvailableSqFt: agr1_total_sqft,
    totalAllocatedSqFt: 0,
    financialSummary: {
      totalCost: agr1_total_cost,
      totalPaid: 800000,
      balanceDue: agr1_total_cost - 800000,
    },
  });

  const p1Doc = agr1.landParcels[0];
  agr1.registryDeeds.push({
    deedNumber: 'AGR-2425-001/DEED-2024-9812',
    deedDate: new Date('2024-05-15'),
    subRegistrarOffice: 'Sadar Registry Office, Danapur',
    registeredDismil: p1_reg_dismil,
    registeredSqFt: p1_reg_sqft,
    allocatedSqFt: 0,
    availableSqFt: p1_reg_sqft,
    parcels: [
      {
        parcelId: p1Doc._id,
        mauja: p1Doc.mauja,
        khataNumber: p1Doc.khataNumber,
        khesraNumber: p1Doc.khesraNumber,
        thanaNumber: p1Doc.thanaNumber,
        registeredDismil: p1_reg_dismil,
        registeredSqFt: p1_reg_sqft,
      },
    ],
    status: 'ACTIVE',
    remarks: 'Registered in favor of Company, Volume 12, Page 88',
  });

  await agr1.save();

  // Create Kisan Financial Ledger entries for Agreement 1
  await KisanLedger.create([
    {
      agreementId: agr1._id,
      agreementNumber: agr1.agreementNumber,
      date: new Date('2024-04-10'),
      type: 'CREDIT',
      amount: agr1_total_cost,
      runningBalance: agr1_total_cost,
      farmerName: 'Ram Prasad Yadav',
      paymentMode: 'AGREEMENT_VALUE',
      remarks: 'Initial agreement value credit (3 Land Parcels: 50.5 Dismil)',
    },
    {
      agreementId: agr1._id,
      agreementNumber: agr1.agreementNumber,
      date: new Date('2024-04-12'),
      type: 'DEBIT',
      amount: 500000,
      runningBalance: agr1_total_cost - 500000,
      farmerName: 'Ram Prasad Yadav',
      paymentMode: 'BANK_TRANSFER',
      receiptNumber: 'KREC-2425-001',
      transactionReference: 'NEFT/UTIB000123/98124',
      remarks: 'Advance token payment paid via bank transfer',
    },
    {
      agreementId: agr1._id,
      agreementNumber: agr1.agreementNumber,
      date: new Date('2024-05-16'),
      type: 'DEBIT',
      amount: 300000,
      runningBalance: agr1_total_cost - 800000,
      farmerName: 'Ram Prasad Yadav',
      paymentMode: 'CHEQUE',
      receiptNumber: 'KREC-2425-002',
      transactionReference: 'CHQ-881204',
      remarks: 'Part payment upon registry deed DEED-2024-9812 execution',
    },
  ]);

  // Create Land Stock Ledger entries for Agreement 1
  await LandStockLedger.create([
    {
      agreementId: agr1._id,
      sourceType: 'AGREEMENT',
      date: new Date('2024-04-10'),
      entryType: 'CREDIT',
      sqFt: agr1_total_sqft,
      dismil: agr1_total_dismil,
      transactionType: 'INITIAL_AGREEMENT',
      runningAvailableSqFt: agr1_total_sqft,
      remarks: 'Land acquisition agreement signed (50.5 Dismil inward)',
    },
    {
      agreementId: agr1._id,
      sourceType: 'REGISTRY_DEED',
      deedId: agr1.registryDeeds[0]._id,
      deedNumber: 'AGR-2425-001/DEED-2024-9812',
      date: new Date('2024-05-15'),
      entryType: 'CREDIT',
      sqFt: p1_reg_sqft,
      dismil: p1_reg_dismil,
      transactionType: 'REGISTRY_CONVERSION',
      runningAvailableSqFt: agr1_total_sqft,
      remarks: 'Deed registered for 10.0 Dismil on Parcel 1 (Rampur 582)',
    },
  ]);

  console.log(`  ✓ Created Agreement 1 (${agr1.agreementNumber}) with 3 land parcels and 1 registered deed.`);

  // Agreement 2: Neora Bihta Multi-Parcel (AGR-2425-002)
  const agr2_p1_d = 20.0;
  const agr2_p1_sqft = Math.round(agr2_p1_d * 435.6 * 100) / 100;
  const agr2_p2_d = 18.0;
  const agr2_p2_sqft = Math.round(agr2_p2_d * 435.6 * 100) / 100;
  const agr2_total_dismil = agr2_p1_d + agr2_p2_d; // 38.0
  const agr2_total_sqft = Math.round(agr2_total_dismil * 435.6 * 100) / 100; // 16552.8
  const agr2_total_cost = 1200000 + 990000; // 2190000

  const agr2_reg_d = 28.0; // 20 dismil on p1 + 8 dismil on p2
  const agr2_reg_sqft = Math.round(agr2_reg_d * 435.6 * 100) / 100;

  const agr2 = new KisanLandAgreement({
    agreementNumber: 'AGR-2425-002',
    agreementDate: new Date('2024-05-01'),
    agreementEndDate: new Date('2024-11-01'),
    araziDismil: agr2_total_dismil,
    totalSqFt: agr2_total_sqft,
    ratePerDismil: 57631,
    ratePerSqFt: 132.3,
    totalAgreementAmount: agr2_total_cost,
    remarks: 'Neora bypass acquisition for highway facing plots.',
    status: 'PARTIALLY_REGISTERED',
    landParcels: [
      {
        mauja: 'Neora',
        khataNumber: '312',
        khesraNumber: '1102',
        thanaNumber: '18',
        jamabandiNumber: 'JB-44',
        chaudhi: {
          north: 'State Highway 98',
          south: 'Plot 1103',
          east: 'Drainage Channel',
          west: 'Dinesh Singh Field',
        },
        araziDismil: agr2_p1_d,
        totalSqFt: agr2_p1_sqft,
        ratePerDismil: 60000,
        ratePerSqFt: 137.74,
        totalAmount: 1200000,
        registeredDismil: agr2_p1_d,
        registeredSqFt: agr2_p1_sqft,
        unregisteredAgreedSqFt: 0,
        unregisteredAvailableSqFt: 0,
        allocatedSqFt: 0,
        availableSqFt: agr2_p1_sqft,
        remarks: 'Fully registered via AGR-2425-002/DEED-2024-4401',
      },
      {
        mauja: 'Neora',
        khataNumber: '312',
        khesraNumber: '1105',
        thanaNumber: '18',
        jamabandiNumber: 'JB-45',
        chaudhi: {
          north: 'Plot 1102',
          south: 'Railway Corridor Boundary',
          east: 'Self Farm Land',
          west: 'Mukesh Rai Land',
        },
        araziDismil: agr2_p2_d,
        totalSqFt: agr2_p2_sqft,
        ratePerDismil: 55000,
        ratePerSqFt: 126.26,
        totalAmount: 990000,
        registeredDismil: 8.0,
        registeredSqFt: Math.round(8.0 * 435.6 * 100) / 100,
        unregisteredAgreedSqFt: Math.round(10.0 * 435.6 * 100) / 100,
        unregisteredAvailableSqFt: Math.round(10.0 * 435.6 * 100) / 100,
        allocatedSqFt: 0,
        availableSqFt: Math.round(8.0 * 435.6 * 100) / 100,
        remarks: '8 Dismil registered; 10 Dismil remaining in agreement pool.',
      },
    ],
    farmers: [
      {
        name: 'Shyam Sundar Singh',
        guardianName: 'Late Jagdish Singh',
        relation: 'Father',
        mobile: '9123456780',
        aadhaarNumber: '456789012345',
        panNumber: 'BCDPS2345G',
        sharePercent: 100,
        address: 'Vill- Neora, Thana- Bihta, Dist- Patna',
      },
    ],
    attachments: [
      {
        fileName: 'LPC_Mutation_Neora_312',
        fileType: 'LPC / Mutation',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/sample_lpc.pdf',
        fileSize: 419430,
        description: 'Land Possession Certificate issued by Circle Officer',
      },
    ],
    totalRegisteredDismil: agr2_reg_d,
    totalRegisteredSqFt: agr2_reg_sqft,
    unregisteredAgreedSqFt: agr2_total_sqft - agr2_reg_sqft,
    unregisteredAvailableSqFt: agr2_total_sqft - agr2_reg_sqft,
    totalAvailableSqFt: agr2_total_sqft,
    totalAllocatedSqFt: 0,
    financialSummary: {
      totalCost: agr2_total_cost,
      totalPaid: 1000000,
      balanceDue: agr2_total_cost - 1000000,
    },
  });

  const agr2_p1 = agr2.landParcels[0];
  const agr2_p2 = agr2.landParcels[1];
  agr2.registryDeeds.push({
    deedNumber: 'AGR-2425-002/DEED-2024-4401',
    deedDate: new Date('2024-06-01'),
    subRegistrarOffice: 'Bihta Sub-Registry Office',
    registeredDismil: agr2_reg_d,
    registeredSqFt: agr2_reg_sqft,
    allocatedSqFt: 0,
    availableSqFt: agr2_reg_sqft,
    parcels: [
      {
        parcelId: agr2_p1._id,
        mauja: agr2_p1.mauja,
        khataNumber: agr2_p1.khataNumber,
        khesraNumber: agr2_p1.khesraNumber,
        thanaNumber: agr2_p1.thanaNumber,
        registeredDismil: agr2_p1_d,
        registeredSqFt: agr2_p1_sqft,
      },
      {
        parcelId: agr2_p2._id,
        mauja: agr2_p2.mauja,
        khataNumber: agr2_p2.khataNumber,
        khesraNumber: agr2_p2.khesraNumber,
        thanaNumber: agr2_p2.thanaNumber,
        registeredDismil: 8.0,
        registeredSqFt: Math.round(8.0 * 435.6 * 100) / 100,
      },
    ],
    status: 'ACTIVE',
    remarks: 'Registered in favor of Good Nature Pvt Ltd',
  });

  await agr2.save();

  // Create Kisan Financial Ledger entries for Agreement 2
  await KisanLedger.create([
    {
      agreementId: agr2._id,
      agreementNumber: agr2.agreementNumber,
      date: new Date('2024-05-01'),
      type: 'CREDIT',
      amount: agr2_total_cost,
      runningBalance: agr2_total_cost,
      farmerName: 'Shyam Sundar Singh',
      paymentMode: 'AGREEMENT_VALUE',
      remarks: 'Initial agreement value credit (2 Land Parcels: 38.0 Dismil)',
    },
    {
      agreementId: agr2._id,
      agreementNumber: agr2.agreementNumber,
      date: new Date('2024-05-05'),
      type: 'DEBIT',
      amount: 1000000,
      runningBalance: agr2_total_cost - 1000000,
      farmerName: 'Shyam Sundar Singh',
      paymentMode: 'NEFT_RTGS',
      receiptNumber: 'KREC-2425-003',
      transactionReference: 'RTGS/SBIN00045/8819',
      remarks: 'Advance payment paid directly via RTGS',
    },
  ]);

  // Land Stock Ledger for Agreement 2
  await LandStockLedger.create([
    {
      agreementId: agr2._id,
      sourceType: 'AGREEMENT',
      date: new Date('2024-05-01'),
      entryType: 'CREDIT',
      sqFt: agr2_total_sqft,
      dismil: agr2_total_dismil,
      transactionType: 'INITIAL_AGREEMENT',
      runningAvailableSqFt: agr2_total_sqft,
      remarks: 'Land acquisition agreement signed (38.0 Dismil inward)',
    },
    {
      agreementId: agr2._id,
      sourceType: 'REGISTRY_DEED',
      deedId: agr2.registryDeeds[0]._id,
      deedNumber: 'AGR-2425-002/DEED-2024-4401',
      date: new Date('2024-06-01'),
      entryType: 'CREDIT',
      sqFt: agr2_reg_sqft,
      dismil: agr2_reg_d,
      transactionType: 'REGISTRY_CONVERSION',
      runningAvailableSqFt: agr2_total_sqft,
      remarks: 'Deed registered for 28.0 Dismil across Parcels 1 & 2',
    },
  ]);

  console.log(`  ✓ Created Agreement 2 (${agr2.agreementNumber}) with 2 land parcels and 1 registered deed.`);

  // Helper function to build agreements 3 to 6
  const createUnregisteredAgreement = async ({
    agreementNumber,
    agreementDate,
    agreementEndDate,
    remarks,
    farmers,
    parcelsRaw,
    paidAmount = 250000,
  }) => {
    let totalDismil = 0;
    let totalCost = 0;

    const landParcels = parcelsRaw.map((p) => {
      const p_sqft = Math.round(p.dismil * 435.6 * 100) / 100;
      const p_amount = Math.round(p.dismil * p.ratePerDismil);
      const p_rateSqft = Math.round((p.ratePerDismil / 435.6) * 100) / 100;

      totalDismil += p.dismil;
      totalCost += p_amount;

      return {
        mauja: p.mauja,
        khataNumber: p.khataNumber,
        khesraNumber: p.khesraNumber,
        thanaNumber: p.thanaNumber || '14',
        jamabandiNumber: p.jamabandiNumber || `JB-${Math.floor(100 + Math.random() * 900)}`,
        chaudhi: p.chaudhi || {
          north: 'Sector Road / Approach Path',
          south: 'Cultivated Farm Land',
          east: 'Canal / Boundary Line',
          west: 'Adjacent Landowner Boundary',
        },
        araziDismil: p.dismil,
        totalSqFt: p_sqft,
        ratePerDismil: p.ratePerDismil,
        ratePerSqFt: p_rateSqft,
        totalAmount: p_amount,
        registeredDismil: 0,
        registeredSqFt: 0,
        unregisteredAgreedSqFt: p_sqft,
        unregisteredAvailableSqFt: p_sqft,
        allocatedSqFt: 0,
        availableSqFt: 0,
        remarks: p.remarks || 'Available in agreement pool',
      };
    });

    totalDismil = Math.round(totalDismil * 100) / 100;
    const totalSqFt = Math.round(totalDismil * 435.6 * 100) / 100;
    const ratePerDismil = Math.round(totalCost / totalDismil);
    const ratePerSqFt = Math.round((ratePerDismil / 435.6) * 100) / 100;

    const agrDoc = new KisanLandAgreement({
      agreementNumber,
      agreementDate: new Date(agreementDate),
      agreementEndDate: agreementEndDate ? new Date(agreementEndDate) : new Date('2024-12-31'),
      araziDismil: totalDismil,
      totalSqFt,
      ratePerDismil,
      ratePerSqFt,
      totalAgreementAmount: totalCost,
      remarks,
      status: 'ACTIVE',
      landParcels,
      farmers,
      attachments: [
        {
          fileName: `${agreementNumber}_Notarized_Agreement`,
          fileType: 'Agreement Scan',
          fileUrl: `https://res.cloudinary.com/demo/image/upload/v1/${agreementNumber.toLowerCase()}.pdf`,
          fileSize: 245760,
          description: 'Original stamped agreement document',
        },
      ],
      registryDeeds: [],
      totalRegisteredDismil: 0,
      totalRegisteredSqFt: 0,
      unregisteredAgreedSqFt: totalSqFt,
      unregisteredAvailableSqFt: totalSqFt,
      totalAvailableSqFt: totalSqFt,
      totalAllocatedSqFt: 0,
      financialSummary: {
        totalCost,
        totalPaid: paidAmount,
        balanceDue: totalCost - paidAmount,
      },
    });

    await agrDoc.save();

    // Financial Ledger Entries
    await KisanLedger.create([
      {
        agreementId: agrDoc._id,
        agreementNumber: agrDoc.agreementNumber,
        date: new Date(agreementDate),
        type: 'CREDIT',
        amount: totalCost,
        runningBalance: totalCost,
        farmerName: farmers[0]?.name || 'Primary Farmer',
        paymentMode: 'AGREEMENT_VALUE',
        remarks: `Initial agreement credit (${totalDismil} Dismil across ${landParcels.length} parcels)`,
      },
      {
        agreementId: agrDoc._id,
        agreementNumber: agrDoc.agreementNumber,
        date: new Date(new Date(agreementDate).getTime() + 2 * 24 * 60 * 60 * 1000),
        type: 'DEBIT',
        amount: paidAmount,
        runningBalance: totalCost - paidAmount,
        farmerName: farmers[0]?.name || 'Primary Farmer',
        paymentMode: 'BANK_TRANSFER',
        referenceNumber: `TXN-${agreementNumber.replace('AGR-', '')}-889`,
        remarks: 'Advance token payment to landowner via RTGS/NEFT',
      },
    ]);

    // Land Stock Ledger
    await LandStockLedger.create([
      {
        agreementId: agrDoc._id,
        sourceType: 'AGREEMENT',
        date: new Date(agreementDate),
        entryType: 'CREDIT',
        sqFt: totalSqFt,
        dismil: totalDismil,
        transactionType: 'INITIAL_AGREEMENT',
        runningAvailableSqFt: totalSqFt,
        remarks: `Land acquisition agreement signed (${totalDismil} Dismil inward across ${landParcels.length} parcels)`,
      },
    ]);

    console.log(`  ✓ Created Agreement ${agreementNumber} with ${landParcels.length} land parcels.`);
    return agrDoc;
  };

  // Agreement 3 (AGR-2425-003)
  await createUnregisteredAgreement({
    agreementNumber: 'AGR-2425-003',
    agreementDate: '2024-05-10',
    agreementEndDate: '2024-11-10',
    remarks: 'Phulwari Sharif prime expansion. 3 parcels across Khata 515 & 516.',
    farmers: [
      {
        name: 'Maheshwar Choudhary',
        guardianName: 'Late Ganga Choudhary',
        relation: 'Father',
        mobile: '9988776655',
        aadhaarNumber: '567890123456',
        panNumber: 'CDEPC3456H',
        sharePercent: 100,
        address: 'Phulwari Sharif, Patna',
      },
    ],
    parcelsRaw: [
      { mauja: 'Phulwari', khataNumber: '515', khesraNumber: '440', dismil: 12.0, ratePerDismil: 75000, thanaNumber: '3', jamabandiNumber: 'JB-88' },
      { mauja: 'Phulwari', khataNumber: '515', khesraNumber: '442', dismil: 14.5, ratePerDismil: 72000, thanaNumber: '3', jamabandiNumber: 'JB-89' },
      { mauja: 'Phulwari', khataNumber: '516', khesraNumber: '445', dismil: 18.0, ratePerDismil: 70000, thanaNumber: '3', jamabandiNumber: 'JB-90' },
    ],
    paidAmount: 350000,
  });

  // Agreement 4 (AGR-2425-004)
  await createUnregisteredAgreement({
    agreementNumber: 'AGR-2425-004',
    agreementDate: '2024-05-18',
    agreementEndDate: '2024-12-15',
    remarks: 'Bihta Kanhauli ring road belt. 3 parcels across 2 distinct Maujas.',
    farmers: [
      {
        name: 'Ram Pravesh Yadav',
        guardianName: 'Devnandan Yadav',
        relation: 'Father',
        mobile: '9835012345',
        aadhaarNumber: '334455667788',
        panNumber: 'APYPR1234K',
        sharePercent: 60,
        address: 'Kanhauli, Bihta, Patna',
      },
      {
        name: 'Sudhir Yadav',
        guardianName: 'Ram Pravesh Yadav',
        relation: 'Father',
        mobile: '9835012346',
        aadhaarNumber: '334455667789',
        panNumber: 'BPYPS5678L',
        sharePercent: 40,
        address: 'Kanhauli, Bihta, Patna',
      },
    ],
    parcelsRaw: [
      { mauja: 'Kanhauli', khataNumber: '210', khesraNumber: '680', dismil: 22.0, ratePerDismil: 62000, thanaNumber: '15', jamabandiNumber: 'JB-210' },
      { mauja: 'Kanhauli', khataNumber: '210', khesraNumber: '682', dismil: 16.0, ratePerDismil: 62000, thanaNumber: '15', jamabandiNumber: 'JB-211' },
      { mauja: 'Paijawa', khataNumber: '88', khesraNumber: '112', dismil: 20.5, ratePerDismil: 58000, thanaNumber: '16', jamabandiNumber: 'JB-304' },
    ],
    paidAmount: 500000,
  });

  // Agreement 5 (AGR-2425-005)
  await createUnregisteredAgreement({
    agreementNumber: 'AGR-2425-005',
    agreementDate: '2024-05-25',
    agreementEndDate: '2024-11-25',
    remarks: 'Danapur-Khagaul connector land. 2 high-value commercial parcels.',
    farmers: [
      {
        name: 'Birendra Kumar Singh',
        guardianName: 'Late Tribhuwan Singh',
        relation: 'Father',
        mobile: '9431088776',
        aadhaarNumber: '778899001122',
        panNumber: 'CPSBK8899N',
        sharePercent: 100,
        address: 'Saguna More, Danapur, Patna',
      },
    ],
    parcelsRaw: [
      { mauja: 'Khagaul', khataNumber: '405', khesraNumber: '921', dismil: 15.0, ratePerDismil: 95000, thanaNumber: '8', jamabandiNumber: 'JB-405' },
      { mauja: 'Khagaul', khataNumber: '405', khesraNumber: '924', dismil: 18.5, ratePerDismil: 92000, thanaNumber: '8', jamabandiNumber: 'JB-406' },
    ],
    paidAmount: 600000,
  });

  // Agreement 6 (AGR-2425-006)
  await createUnregisteredAgreement({
    agreementNumber: 'AGR-2425-006',
    agreementDate: '2024-06-02',
    agreementEndDate: '2024-12-02',
    remarks: 'Naubatpur Lakhna agricultural corridor. 4 multi-khesra parcels.',
    farmers: [
      {
        name: 'Awadhesh Kumar Mishra',
        guardianName: 'Kameshwar Mishra',
        relation: 'Father',
        mobile: '9934112233',
        aadhaarNumber: '112233445566',
        panNumber: 'AKMPM7788Q',
        sharePercent: 100,
        address: 'Lakhna, Naubatpur, Patna',
      },
    ],
    parcelsRaw: [
      { mauja: 'Naubatpur', khataNumber: '178', khesraNumber: '301', dismil: 10.0, ratePerDismil: 45000, thanaNumber: '22', jamabandiNumber: 'JB-178' },
      { mauja: 'Naubatpur', khataNumber: '178', khesraNumber: '304', dismil: 12.5, ratePerDismil: 45000, thanaNumber: '22', jamabandiNumber: 'JB-179' },
      { mauja: 'Lakhna', khataNumber: '95', khesraNumber: '144', dismil: 15.0, ratePerDismil: 42000, thanaNumber: '23', jamabandiNumber: 'JB-882' },
      { mauja: 'Lakhna', khataNumber: '95', khesraNumber: '148', dismil: 20.0, ratePerDismil: 42000, thanaNumber: '23', jamabandiNumber: 'JB-883' },
    ],
    paidAmount: 400000,
  });

  console.log(`  ✓ Successfully seeded exactly 6 Kisan Land Agreements (AGR-2425-001 to AGR-2425-006).\n`);

  console.log('════════════════════════════════════════════════════════════════');
  console.log('🎉 GOOD NATURE EMS CLEAN SEEDING COMPLETED SUCCESSFULLY!');
  console.log('════════════════════════════════════════════════════════════════');
  console.log('📊 Summary of Seeded Database State:');
  console.log(`  • Sponsors: 7 Total`);
  console.log(`    - 2 Direct Company Partners (SP-1001 Ravi Kumar, SP-1002 Priya Singh)`);
  console.log(`    - 5 Sub-Sponsors / Promoters (SP-2001 to SP-2005)`);
  console.log(`  • Customers: 10 Total`);
  console.log(`    - 2 Direct Company Customers (CUST-001 Suresh Verma, CUST-002 Rajesh Mishra)`);
  console.log(`    - 8 Sub-Sponsor Customers (CUST-003 to CUST-010)`);
  console.log(`  • Kisan Land Agreements: Exactly 6 (AGR-2425-001 to AGR-2425-006)`);
  console.log(`  • Registry Deeds: 2 Active Deeds (under Agreements 1 & 2)`);
  console.log(`  • Plot Series Masters: 4 (E, A, D, C) with ${createdPlotsE.length + createdPlotsA.length + createdPlotsD.length + createdPlotsC.length} total plots (ALL AVAILABLE)`);
  console.log(`  • Bookings / Collections / Receipts: ZERO (Clean database ready for fresh testing)`);
  console.log('════════════════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB.');
}

seed().catch((err) => {
  console.error('❌ Seeding failed with error:', err);
  process.exit(1);
});
