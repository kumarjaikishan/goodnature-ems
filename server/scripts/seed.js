/**
 * Database Seed Script for Good Nature EMS (Plots, Series, Kisan Land Agreements, Ledgers, & Bookings)
 * ─────────────────────────────────────────────────────────────────────────────
 * Usage: node server/scripts/seed.js  (or npm run seed from server/)
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
const plotsService = require('../services/plots.service');

const DB_URI = process.env.db;

async function seed() {
  console.log('🚀 Starting Good Nature EMS Seed Script...');
  console.log('📡 Connecting to MongoDB:', DB_URI);
  await mongoose.connect(DB_URI);
  console.log('✅ Connected to MongoDB successfully.\n');

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 1: DROP / CLEAN OLD RELEVANT TEST DATA
  // ───────────────────────────────────────────────────────────────────────────
  console.log('🧹 Cleaning previous plot, kisan land, and booking test collections...');
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
  console.log('✅ Previous collections cleared.\n');

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 2: CREATE SPONSORS / PROMOTERS & CUSTOMERS
  // ───────────────────────────────────────────────────────────────────────────
  console.log('👥 Creating Sponsors / Promoters & Customers...');

  const promotersData = [
    {
      name: 'Ravi Kumar (Senior Promoter)',
      email: 'sponsor.ravi@goodnature.com',
      password: 'password123',
      role: 'sponsor',
      sponsorCode: 'SP-1001',
      mobile: '9876543201',
    },
    {
      name: 'Priya Singh (Executive Promoter)',
      email: 'sponsor.priya@goodnature.com',
      password: 'password123',
      role: 'sponsor',
      sponsorCode: 'SP-1002',
      mobile: '9876543202',
    },
    {
      name: 'Manoj Gupta (Star Promoter)',
      email: 'sponsor.manoj@goodnature.com',
      password: 'password123',
      role: 'sponsor',
      sponsorCode: 'SP-1003',
      mobile: '9876543203',
    },
    {
      name: 'Amit Sinha (Regional Promoter)',
      email: 'sponsor.amit@goodnature.com',
      password: 'password123',
      role: 'sponsor',
      sponsorCode: 'SP-1004',
      mobile: '9876543204',
    },
    {
      name: 'Sneha Raj (Promoter Lead)',
      email: 'sponsor.sneha@goodnature.com',
      password: 'password123',
      role: 'sponsor',
      sponsorCode: 'SP-1005',
      mobile: '9876543205',
    },
  ];

  const sponsorUsers = [];
  for (const pData of promotersData) {
    let existingUser = await User.findOne({ email: pData.email });
    if (!existingUser) {
      existingUser = await User.create(pData);
    }
    sponsorUsers.push(existingUser);
  }
  console.log(`  ✓ Created / Verified ${sponsorUsers.length} Promoters/Sponsors (${sponsorUsers.map(s => s.name.split(' ')[0]).join(', ')}).`);

  const rawCustomers = [
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
    },
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
    },
    {
      customerId: 'CUST-011',
      name: 'Santosh Kumar Tiwary',
      mobile: '9431876543',
      email: 'santosh.tiwary@example.com',
      address: 'Saguna More, Bailey Road, Patna',
      city: 'Patna',
      state: 'Bihar',
      pincode: '801503',
      fatherOrHusbandName: 'B. N. Tiwary',
      gender: 'Male',
      occupation: 'Senior Engineer',
      nomineeName: 'Rekha Tiwary',
      nomineeRelation: 'Wife',
    },
    {
      customerId: 'CUST-012',
      name: 'Neha Roy',
      mobile: '9835765432',
      email: 'neha.roy@example.com',
      address: 'Rajendra Nagar, Road No 5, Patna',
      city: 'Patna',
      state: 'Bihar',
      pincode: '800016',
      fatherOrHusbandName: 'Arvind Roy',
      gender: 'Female',
      occupation: 'Software Engineer',
      nomineeName: 'Arvind Roy',
      nomineeRelation: 'Father',
    },
    {
      customerId: 'CUST-013',
      name: 'Alok Ranjan',
      mobile: '9128012345',
      email: 'alok.ranjan@example.com',
      address: 'Shivala More, Danapur-Khagaul Road',
      city: 'Patna',
      state: 'Bihar',
      pincode: '801105',
      fatherOrHusbandName: 'M. P. Ranjan',
      gender: 'Male',
      occupation: 'Real Estate Investor',
      nomineeName: 'Madhu Ranjan',
      nomineeRelation: 'Wife',
    },
    {
      customerId: 'CUST-014',
      name: 'Pankaj Kumar Gupta',
      mobile: '9334198765',
      email: 'pankaj.gupta@example.com',
      address: 'Bihta IIT Main Gate Road',
      city: 'Patna',
      state: 'Bihar',
      pincode: '801106',
      fatherOrHusbandName: 'R. K. Gupta',
      gender: 'Male',
      occupation: 'Trader & Distributor',
      nomineeName: 'Sarita Gupta',
      nomineeRelation: 'Wife',
    },
    {
      customerId: 'CUST-015',
      name: 'Dr. Sanjay Kumar Sinha',
      mobile: '9431012399',
      email: 'dr.sanjaysinha@example.com',
      address: 'Kankarbagh Main Road, Doctor Colony',
      city: 'Patna',
      state: 'Bihar',
      pincode: '800020',
      fatherOrHusbandName: 'Late Dr. B. K. Sinha',
      gender: 'Male',
      occupation: 'Surgeon',
      nomineeName: 'Dr. Rashmi Sinha',
      nomineeRelation: 'Wife',
    },
    {
      customerId: 'CUST-016',
      name: 'Meena Kumari',
      mobile: '9835889900',
      email: 'meena.kumari@example.com',
      address: 'Digha Ghat Road, Patna',
      city: 'Patna',
      state: 'Bihar',
      pincode: '800011',
      fatherOrHusbandName: 'Sitaram Prasad',
      gender: 'Female',
      occupation: 'Govt School Principal',
      nomineeName: 'Sitaram Prasad',
      nomineeRelation: 'Husband',
    },
    {
      customerId: 'CUST-017',
      name: 'Rameshwar Pandey',
      mobile: '9934112233',
      email: 'rameshwar.pandey@example.com',
      address: 'Maner Dargah Road, Maner',
      city: 'Patna',
      state: 'Bihar',
      pincode: '801180',
      fatherOrHusbandName: 'Late Kashi Pandey',
      gender: 'Male',
      occupation: 'Agriculturist & Landowner',
      nomineeName: 'Devaki Pandey',
      nomineeRelation: 'Wife',
    },
    {
      customerId: 'CUST-018',
      name: 'Kavita Singh',
      mobile: '9708114455',
      email: 'kavita.singh@example.com',
      address: 'Anandpuri, West Boring Canal Road',
      city: 'Patna',
      state: 'Bihar',
      pincode: '800001',
      fatherOrHusbandName: 'Ajay Kumar Singh',
      gender: 'Female',
      occupation: 'Architect',
      nomineeName: 'Ajay Kumar Singh',
      nomineeRelation: 'Husband',
    },
  ];

  // Distribute customers across the 5 promoters randomly and evenly
  const customersData = rawCustomers.map((cust, idx) => {
    const assignedSponsor = sponsorUsers[idx % sponsorUsers.length];
    return {
      ...cust,
      sponsorId: assignedSponsor._id,
    };
  });

  const createdCustomers = await PlotCustomer.insertMany(customersData);
  console.log(`  ✓ Created ${createdCustomers.length} Customers distributed across ${sponsorUsers.length} Promoters.\n`);

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 3: CREATE PLOT SERIES MASTERS & PLOTS
  // ───────────────────────────────────────────────────────────────────────────
  console.log('🏗️ Creating Plot Series Masters and Plots...');

  // 1. E Series: 1 to 11 plots, 800 sqft (20 x 40)
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
  console.log(`  ✓ Created Series E (800 SqFt 20x40) with ${createdPlotsE.length} plots (E-001 to E-011).`);

  // 2. A Series: 40 x 60 (2400 sqft)
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
  console.log(`  ✓ Created Series A (2400 SqFt 40x60) with ${createdPlotsA.length} plots (A-001 to A-010).`);

  // 3. D Series: 40 x 40 (1600 sqft)
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
  console.log(`  ✓ Created Series D (1600 SqFt 40x40) with ${createdPlotsD.length} plots (D-001 to D-010).`);

  // 4. C Series: 30 x 40 (1200 sqft)
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
  console.log(`  ✓ Created Series C (1200 SqFt 30x40) with ${createdPlotsC.length} plots (C-001 to C-010).\n`);

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 4: CREATE MULTI-PARCEL KISAN LAND AGREEMENTS, DEEDS & LEDGERS
  // ───────────────────────────────────────────────────────────────────────────
  console.log('🌾 Creating Multi-Parcel Kisan Land Agreements & Ledgers...');

  // Agreement 1: Danapur & Bihta Multi-Parcel
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
    agreementNumber: 'AGR-2627-001',
    agreementDate: new Date('2026-04-10'),
    agreementEndDate: new Date('2026-10-10'),
    araziDismil: agr1_total_dismil,
    totalSqFt: agr1_total_sqft,
    ratePerDismil: 47524,
    ratePerSqFt: 109.1,
    totalAgreementAmount: agr1_total_cost,
    remarks: 'Acquired via Danapur circle. 3 parcels with 1 converted registry deed.',
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
        remarks: '10 Dismil registered under DEED-2026-9812; 5.5 Dismil remains in agreement pool.',
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
      {
        fileName: 'Khatiyan_7_12_Rampur_582',
        fileType: 'Khatiyan (7/12)',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/sample_khatiyan.pdf',
        fileSize: 524288,
        description: 'Revenue Khatiyan extract',
      },
      {
        fileName: 'Naksha_Rampur_Plot582',
        fileType: 'Naksha / Map',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/sample_map.png',
        fileSize: 819200,
        description: 'Cadastral land map showing road alignment',
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
    deedNumber: 'AGR-2627-001/DEED-2026-9812',
    deedDate: new Date('2026-05-15'),
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
      date: new Date('2026-04-10'),
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
      date: new Date('2026-04-12'),
      type: 'DEBIT',
      amount: 500000,
      runningBalance: agr1_total_cost - 500000,
      farmerName: 'Ram Prasad Yadav',
      paymentMode: 'BANK_TRANSFER',
      receiptNumber: 'KREC-2627-001',
      transactionReference: 'NEFT/UTIB000123/98124',
      remarks: 'Advance token payment paid via bank transfer',
    },
    {
      agreementId: agr1._id,
      agreementNumber: agr1.agreementNumber,
      date: new Date('2026-05-16'),
      type: 'DEBIT',
      amount: 300000,
      runningBalance: agr1_total_cost - 800000,
      farmerName: 'Ram Prasad Yadav',
      paymentMode: 'CHEQUE',
      receiptNumber: 'KREC-2627-002',
      transactionReference: 'CHQ-881204',
      remarks: 'Part payment upon registry deed DEED-2026-9812 execution',
    },
  ]);

  // Create Land Stock Ledger entries for Agreement 1
  await LandStockLedger.create([
    {
      agreementId: agr1._id,
      sourceType: 'AGREEMENT',
      date: new Date('2026-04-10'),
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
      deedNumber: 'AGR-2627-001/DEED-2026-9812',
      date: new Date('2026-05-15'),
      entryType: 'CREDIT',
      sqFt: p1_reg_sqft,
      dismil: p1_reg_dismil,
      transactionType: 'REGISTRY_CONVERSION',
      runningAvailableSqFt: agr1_total_sqft,
      remarks: 'Deed registered for 10.0 Dismil on Parcel 1 (Rampur 582)',
    },
  ]);

  console.log(`  ✓ Created Agreement 1 (${agr1.agreementNumber}) with 3 parcels, 1 deed, and active Kisan Ledger.`);

  // Agreement 2: Neora Bihta Multi-Parcel
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
    agreementNumber: 'AGR-2627-002',
    agreementDate: new Date('2026-05-01'),
    agreementEndDate: new Date('2026-11-01'),
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
        remarks: 'Fully registered via AGR-2627-002/DEED-2026-4401',
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
      {
        fileName: 'Lagan_Receipt_2025_26',
        fileType: 'Revenue Receipt',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/sample_receipt.pdf',
        fileSize: 209715,
        description: 'Updated revenue lagan receipt',
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
    deedNumber: 'AGR-2627-002/DEED-2026-4401',
    deedDate: new Date('2026-06-01'),
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
      date: new Date('2026-05-01'),
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
      date: new Date('2026-05-05'),
      type: 'DEBIT',
      amount: 1000000,
      runningBalance: agr2_total_cost - 1000000,
      farmerName: 'Shyam Sundar Singh',
      paymentMode: 'NEFT_RTGS',
      receiptNumber: 'KREC-2627-003',
      transactionReference: 'RTGS/SBIN00045/8819',
      remarks: 'Advance payment paid directly via RTGS',
    },
  ]);

  // Land Stock Ledger for Agreement 2
  await LandStockLedger.create([
    {
      agreementId: agr2._id,
      sourceType: 'AGREEMENT',
      date: new Date('2026-05-01'),
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
      deedNumber: 'AGR-2627-002/DEED-2026-4401',
      date: new Date('2026-06-01'),
      entryType: 'CREDIT',
      sqFt: agr2_reg_sqft,
      dismil: agr2_reg_d,
      transactionType: 'REGISTRY_CONVERSION',
      runningAvailableSqFt: agr2_total_sqft,
      remarks: 'Deed registered for 28.0 Dismil across Parcels 1 & 2',
    },
  ]);

  console.log(`  ✓ Created Agreement 2 (${agr2.agreementNumber}) with 2 parcels, 1 deed, and active Kisan Ledger.`);

  // Helper function to build clean un-registered multi-parcel agreements
  const createUnregisteredAgreement = async ({
    agreementNumber,
    agreementDate,
    agreementEndDate,
    remarks,
    farmers,
    parcelsRaw,
    paidAmount = 150000,
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
        remarks: p.remarks || 'Available for Registry Deed conversion',
      };
    });

    totalDismil = Math.round(totalDismil * 100) / 100;
    const totalSqFt = Math.round(totalDismil * 435.6 * 100) / 100;
    const ratePerDismil = Math.round(totalCost / totalDismil);
    const ratePerSqFt = Math.round((ratePerDismil / 435.6) * 100) / 100;

    const agrDoc = new KisanLandAgreement({
      agreementNumber,
      agreementDate: new Date(agreementDate),
      agreementEndDate: agreementEndDate ? new Date(agreementEndDate) : new Date('2026-12-31'),
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

    console.log(`  ✓ Created Agreement (${agreementNumber}) with ${landParcels.length} parcels (0 deeds) & Kisan Ledger.`);
    return agrDoc;
  };

  // 10 Multi-Parcel, 0-Deed Agreements (AGR-2627-003 to AGR-2627-012)
  await createUnregisteredAgreement({
    agreementNumber: 'AGR-2627-003',
    agreementDate: '2026-05-10',
    agreementEndDate: '2026-11-10',
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

  await createUnregisteredAgreement({
    agreementNumber: 'AGR-2627-004',
    agreementDate: '2026-05-18',
    agreementEndDate: '2026-12-15',
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

  await createUnregisteredAgreement({
    agreementNumber: 'AGR-2627-005',
    agreementDate: '2026-05-25',
    agreementEndDate: '2026-11-25',
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

  await createUnregisteredAgreement({
    agreementNumber: 'AGR-2627-006',
    agreementDate: '2026-06-02',
    agreementEndDate: '2026-12-02',
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

  await createUnregisteredAgreement({
    agreementNumber: 'AGR-2627-007',
    agreementDate: '2026-06-08',
    agreementEndDate: '2026-12-20',
    remarks: 'Shivala-Parbatpur bypass expansion. 3 parcels on main bypass link.',
    farmers: [
      {
        name: 'Gajendra Prasad',
        guardianName: 'Late Bindeshwari Prasad',
        relation: 'Father',
        mobile: '9708112244',
        aadhaarNumber: '998811223344',
        panNumber: 'CPGPP4455R',
        sharePercent: 100,
        address: 'Shivala Chowk, Patna',
      },
    ],
    parcelsRaw: [
      { mauja: 'Shivala', khataNumber: '612', khesraNumber: '802', dismil: 16.0, ratePerDismil: 52000, thanaNumber: '11', jamabandiNumber: 'JB-612' },
      { mauja: 'Shivala', khataNumber: '612', khesraNumber: '805', dismil: 14.0, ratePerDismil: 52000, thanaNumber: '11', jamabandiNumber: 'JB-613' },
      { mauja: 'Parbatpur', khataNumber: '340', khesraNumber: '550', dismil: 25.0, ratePerDismil: 48000, thanaNumber: '12', jamabandiNumber: 'JB-901' },
    ],
    paidAmount: 450000,
  });

  await createUnregisteredAgreement({
    agreementNumber: 'AGR-2627-008',
    agreementDate: '2026-06-15',
    agreementEndDate: '2027-01-15',
    remarks: 'Maner riverview township sector. 3 fertile parcels.',
    farmers: [
      {
        name: 'Harendra Rai',
        guardianName: 'Babulal Rai',
        relation: 'Father',
        mobile: '9122334455',
        aadhaarNumber: '445566778899',
        panNumber: 'BIPHR6677T',
        sharePercent: 50,
        address: 'Maner Bazar, Patna',
      },
      {
        name: 'Jitendra Rai',
        guardianName: 'Babulal Rai',
        relation: 'Father',
        mobile: '9122334456',
        aadhaarNumber: '445566778890',
        panNumber: 'BIPJR6678U',
        sharePercent: 50,
        address: 'Maner Bazar, Patna',
      },
    ],
    parcelsRaw: [
      { mauja: 'Maner', khataNumber: '730', khesraNumber: '1205', dismil: 30.0, ratePerDismil: 40000, thanaNumber: '29', jamabandiNumber: 'JB-730' },
      { mauja: 'Maner', khataNumber: '730', khesraNumber: '1208', dismil: 22.0, ratePerDismil: 40000, thanaNumber: '29', jamabandiNumber: 'JB-731' },
      { mauja: 'Sadisopur', khataNumber: '144', khesraNumber: '310', dismil: 18.0, ratePerDismil: 46000, thanaNumber: '30', jamabandiNumber: 'JB-144' },
    ],
    paidAmount: 550000,
  });

  await createUnregisteredAgreement({
    agreementNumber: 'AGR-2627-009',
    agreementDate: '2026-06-22',
    agreementEndDate: '2027-01-20',
    remarks: 'Bikram agricultural node with future highway interchange.',
    farmers: [
      {
        name: 'Chandreshwar Pandey',
        guardianName: 'Late Shivnath Pandey',
        relation: 'Father',
        mobile: '9835778899',
        aadhaarNumber: '887766554433',
        panNumber: 'AYPCP9900M',
        sharePercent: 100,
        address: 'Bikram, Patna',
      },
    ],
    parcelsRaw: [
      { mauja: 'Bikram', khataNumber: '522', khesraNumber: '710', dismil: 24.0, ratePerDismil: 38000, thanaNumber: '41', jamabandiNumber: 'JB-522' },
      { mauja: 'Bikram', khataNumber: '522', khesraNumber: '715', dismil: 26.0, ratePerDismil: 38000, thanaNumber: '41', jamabandiNumber: 'JB-523' },
      { mauja: 'Gorakhri', khataNumber: '89', khesraNumber: '215', dismil: 15.0, ratePerDismil: 35000, thanaNumber: '42', jamabandiNumber: 'JB-215' },
    ],
    paidAmount: 300000,
  });

  await createUnregisteredAgreement({
    agreementNumber: 'AGR-2627-010',
    agreementDate: '2026-06-28',
    agreementEndDate: '2027-02-15',
    remarks: 'Sarmera-Bihta four-lane frontage land. 3 wide frontage parcels.',
    farmers: [
      {
        name: 'Umeshwar Prasad Sah',
        guardianName: 'Late Jaglal Sah',
        relation: 'Father',
        mobile: '9470998811',
        aadhaarNumber: '223344556677',
        panNumber: 'BVUPS1122P',
        sharePercent: 100,
        address: 'Neora Colony, Patna',
      },
    ],
    parcelsRaw: [
      { mauja: 'Neora', khataNumber: '415', khesraNumber: '1330', dismil: 20.0, ratePerDismil: 56000, thanaNumber: '18', jamabandiNumber: 'JB-415' },
      { mauja: 'Neora', khataNumber: '415', khesraNumber: '1335', dismil: 18.0, ratePerDismil: 56000, thanaNumber: '18', jamabandiNumber: 'JB-416' },
      { mauja: 'Rampur', khataNumber: '110', khesraNumber: '610', dismil: 12.0, ratePerDismil: 52000, thanaNumber: '12', jamabandiNumber: 'JB-610' },
    ],
    paidAmount: 420000,
  });

  await createUnregisteredAgreement({
    agreementNumber: 'AGR-2627-011',
    agreementDate: '2026-07-04',
    agreementEndDate: '2027-02-28',
    remarks: 'Paijawa Green Meadows township parcel group.',
    farmers: [
      {
        name: 'Dharmendra Kumar Gupta',
        guardianName: 'Ramanand Gupta',
        relation: 'Father',
        mobile: '9835889900',
        aadhaarNumber: '667788990011',
        panNumber: 'AKPGP3344R',
        sharePercent: 100,
        address: 'Paijawa, Bihta, Patna',
      },
    ],
    parcelsRaw: [
      { mauja: 'Paijawa', khataNumber: '120', khesraNumber: '340', dismil: 17.5, ratePerDismil: 48000, thanaNumber: '16', jamabandiNumber: 'JB-120' },
      { mauja: 'Paijawa', khataNumber: '120', khesraNumber: '344', dismil: 15.0, ratePerDismil: 48000, thanaNumber: '16', jamabandiNumber: 'JB-121' },
      { mauja: 'Kanhauli', khataNumber: '215', khesraNumber: '702', dismil: 21.0, ratePerDismil: 60000, thanaNumber: '15', jamabandiNumber: 'JB-702' },
    ],
    paidAmount: 380000,
  });

  await createUnregisteredAgreement({
    agreementNumber: 'AGR-2627-012',
    agreementDate: '2026-07-10',
    agreementEndDate: '2027-03-10',
    remarks: 'Danapur West residential extension zone. 3 high potential plots.',
    farmers: [
      {
        name: 'Kailash Nath Tiwary',
        guardianName: 'Late B. N. Tiwary',
        relation: 'Father',
        mobile: '9123889900',
        aadhaarNumber: '119988776655',
        panNumber: 'ABTPT5566S',
        sharePercent: 100,
        address: 'Danapur Cantt, Patna',
      },
    ],
    parcelsRaw: [
      { mauja: 'Danapur', khataNumber: '601', khesraNumber: '1410', dismil: 14.0, ratePerDismil: 88000, thanaNumber: '14', jamabandiNumber: 'JB-601' },
      { mauja: 'Danapur', khataNumber: '601', khesraNumber: '1415', dismil: 16.5, ratePerDismil: 88000, thanaNumber: '14', jamabandiNumber: 'JB-602' },
      { mauja: 'Khagaul', khataNumber: '420', khesraNumber: '960', dismil: 11.5, ratePerDismil: 90000, thanaNumber: '8', jamabandiNumber: 'JB-960' },
    ],
    paidAmount: 480000,
  });

  console.log(`  ✓ Successfully seeded all 12 Kisan Land Agreements (AGR-2627-001 to AGR-2627-012).\n`);

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 5: SEED SAMPLE BOOKINGS ACROSS E, A, D, AND C SERIES PLOTS
  // ───────────────────────────────────────────────────────────────────────────
  console.log('📑 Seeding Sample Plot Bookings & Allocating Land Stock...');

  // 1. Booking 1: Plot E-001 (800 sqft, EMI scheme, sourced from Deed DEED-2026-9812)
  const plotE1 = createdPlotsE[0];
  const deed1 = agr1.registryDeeds[0];

  const booking1 = await PlotBooking.create({
    bookingNumber: 'PB-2627-001',
    bookingDate: new Date('2026-06-15'),
    customerId: createdCustomers[0]._id,
    sponsorId: createdCustomers[0].sponsorId || sponsorUsers[0]._id,
    plotId: plotE1._id,
    plotValue: 800000,
    scheme: 'MONTHLY_INSTALLMENT',
    tenureMonths: 60,
    downpaymentMonths: 1,
    downpaymentAmount: 160000,
    bookingAmount: 160000,
    remainingAmount: 640000,
    emiMonthlyAmount: 10667,
    status: 'ACTIVE',
    agreementNumber: 'PAGR-2627-001',
    landSourcing: [
      {
        sourceType: 'REGISTRY_DEED',
        agreementId: agr1._id,
        agreementNumber: agr1.agreementNumber,
        deedId: deed1._id,
        deedNumber: deed1.deedNumber,
        mauja: deed1.parcels[0]?.mauja || 'Rampur',
        khataNumber: deed1.parcels[0]?.khataNumber || '104',
        khesraNumber: deed1.parcels[0]?.khesraNumber || '582',
        allocatedSqFt: 800,
        allocatedDismil: Math.round((800 / 435.6) * 100) / 100,
      },
    ],
    notes: 'Booked by Suresh Verma with 20% downpayment on Plot E-001 (20x40).',
  });

  plotE1.status = 'BOOKED';
  await plotE1.save();

  // Deduct stock in deed1 & agreement1
  deed1.allocatedSqFt = (deed1.allocatedSqFt || 0) + 800;
  deed1.availableSqFt = Math.max(0, deed1.registeredSqFt - deed1.allocatedSqFt);
  agr1.totalAllocatedSqFt = (agr1.totalAllocatedSqFt || 0) + 800;
  agr1.totalAvailableSqFt = Math.max(0, agr1.totalSqFt - agr1.totalAllocatedSqFt);
  await agr1.save();

  // Write Stock Ledger Debit
  await LandStockLedger.create({
    agreementId: agr1._id,
    sourceType: 'REGISTRY_DEED',
    deedId: deed1._id,
    deedNumber: deed1.deedNumber,
    bookingId: booking1._id,
    bookingNumber: booking1.bookingNumber,
    customerName: createdCustomers[0].name,
    plotNumber: plotE1.plotNumber,
    date: new Date('2026-06-15'),
    entryType: 'DEBIT',
    sqFt: 800,
    dismil: 800 / 435.6,
    transactionType: 'BOOKING_ALLOCATION',
    runningAvailableSqFt: agr1.totalAvailableSqFt,
    remarks: `Allocated to Booking ${booking1.bookingNumber} for Plot ${plotE1.plotNumber}`,
  });

  // Create initial downpayment receipt for booking 1
  await PlotReceipt.create({
    receiptType: 'DOWNPAYMENT',
    bookingId: booking1._id,
    receiptNumber: 'RCPT-2627-001',
    amount: 160000,
    paymentMode: 'BANK_TRANSFER',
    transactionReference: 'IMPS/9981240/SURESH',
    status: 'APPROVED',
    remarks: 'Booking downpayment received',
  });

  await plotsService.rebuildBookingInstallmentsState(booking1._id).catch(() => {});
  console.log(`  ✓ Seeded Booking 1 (${booking1.bookingNumber}) on Plot ${plotE1.plotNumber} (E-Series 800 SqFt).`);

  // 2. Booking 2: Plot A-001 (2400 sqft, 40x60, Full Payment, Sourced from DEED-2026-4401)
  const plotA1 = createdPlotsA[0];
  const deed2 = agr2.registryDeeds[0];

  const booking2 = await PlotBooking.create({
    bookingNumber: 'PB-2627-002',
    bookingDate: new Date('2026-06-20'),
    customerId: createdCustomers[1]._id,
    sponsorId: createdCustomers[1].sponsorId || sponsorUsers[1]._id,
    plotId: plotA1._id,
    plotValue: 2880000,
    scheme: 'FULL_PAYMENT',
    bookingAmount: 2880000,
    remainingAmount: 0,
    status: 'COMPLETED',
    agreementNumber: 'PAGR-2627-002',
    landSourcing: [
      {
        sourceType: 'REGISTRY_DEED',
        agreementId: agr2._id,
        agreementNumber: agr2.agreementNumber,
        deedId: deed2._id,
        deedNumber: deed2.deedNumber,
        mauja: deed2.parcels[0]?.mauja || 'Neora',
        khataNumber: deed2.parcels[0]?.khataNumber || '312',
        khesraNumber: deed2.parcels[0]?.khesraNumber || '1102',
        allocatedSqFt: 2400,
        allocatedDismil: Math.round((2400 / 435.6) * 100) / 100,
      },
    ],
    notes: 'Booked by Rajesh Mishra on Plot A-001 (40x60 Villa Plot) with full upfront payment.',
  });

  plotA1.status = 'BOOKED';
  await plotA1.save();

  deed2.allocatedSqFt = (deed2.allocatedSqFt || 0) + 2400;
  deed2.availableSqFt = Math.max(0, deed2.registeredSqFt - deed2.allocatedSqFt);
  agr2.totalAllocatedSqFt = (agr2.totalAllocatedSqFt || 0) + 2400;
  agr2.totalAvailableSqFt = Math.max(0, agr2.totalSqFt - agr2.totalAllocatedSqFt);
  await agr2.save();

  await LandStockLedger.create({
    agreementId: agr2._id,
    sourceType: 'REGISTRY_DEED',
    deedId: deed2._id,
    deedNumber: deed2.deedNumber,
    bookingId: booking2._id,
    bookingNumber: booking2.bookingNumber,
    customerName: createdCustomers[1].name,
    plotNumber: plotA1.plotNumber,
    date: new Date('2026-06-20'),
    entryType: 'DEBIT',
    sqFt: 2400,
    dismil: 2400 / 435.6,
    transactionType: 'BOOKING_ALLOCATION',
    runningAvailableSqFt: agr2.totalAvailableSqFt,
    remarks: `Allocated to Booking ${booking2.bookingNumber} for Plot ${plotA1.plotNumber}`,
  });

  await PlotReceipt.create({
    receiptType: 'FULL_PAYMENT',
    bookingId: booking2._id,
    receiptNumber: 'RCPT-2627-002',
    amount: 2880000,
    paymentMode: 'CHEQUE',
    transactionReference: 'CHQ-551029',
    status: 'APPROVED',
    remarks: 'Full payment received upfront for Plot A-001',
  });

  await plotsService.rebuildBookingInstallmentsState(booking2._id).catch(() => {});
  console.log(`  ✓ Seeded Booking 2 (${booking2.bookingNumber}) on Plot ${plotA1.plotNumber} (A-Series 2400 SqFt).`);

  // 3. Booking 3: Plot D-001 (1600 sqft, 40x40, Sourced from DEED-2026-4401)
  const plotD1 = createdPlotsD[0];
  const booking3 = await PlotBooking.create({
    bookingNumber: 'PB-2627-003',
    bookingDate: new Date('2026-07-05'),
    customerId: createdCustomers[2]._id,
    sponsorId: createdCustomers[2].sponsorId || sponsorUsers[2]._id,
    plotId: plotD1._id,
    plotValue: 1760000,
    scheme: 'MONTHLY_INSTALLMENT',
    tenureMonths: 36,
    downpaymentMonths: 1,
    downpaymentAmount: 352000,
    bookingAmount: 352000,
    remainingAmount: 1408000,
    emiMonthlyAmount: 39111,
    status: 'ACTIVE',
    agreementNumber: 'PAGR-2627-003',
    landSourcing: [
      {
        sourceType: 'REGISTRY_DEED',
        agreementId: agr2._id,
        agreementNumber: agr2.agreementNumber,
        deedId: deed2._id,
        deedNumber: deed2.deedNumber,
        mauja: deed2.parcels[0]?.mauja || 'Neora',
        khataNumber: deed2.parcels[0]?.khataNumber || '312',
        khesraNumber: deed2.parcels[0]?.khesraNumber || '1102',
        allocatedSqFt: 1600,
        allocatedDismil: Math.round((1600 / 435.6) * 100) / 100,
      },
    ],
    notes: 'Booked by Sunita Devi on Plot D-001 (40x40 Commercial).',
  });

  plotD1.status = 'BOOKED';
  await plotD1.save();

  deed2.allocatedSqFt = (deed2.allocatedSqFt || 0) + 1600;
  deed2.availableSqFt = Math.max(0, deed2.registeredSqFt - deed2.allocatedSqFt);
  agr2.totalAllocatedSqFt = (agr2.totalAllocatedSqFt || 0) + 1600;
  agr2.totalAvailableSqFt = Math.max(0, agr2.totalSqFt - agr2.totalAllocatedSqFt);
  await agr2.save();

  await LandStockLedger.create({
    agreementId: agr2._id,
    sourceType: 'REGISTRY_DEED',
    deedId: deed2._id,
    deedNumber: deed2.deedNumber,
    bookingId: booking3._id,
    bookingNumber: booking3.bookingNumber,
    customerName: createdCustomers[2].name,
    plotNumber: plotD1.plotNumber,
    date: new Date('2026-07-05'),
    entryType: 'DEBIT',
    sqFt: 1600,
    dismil: 1600 / 435.6,
    transactionType: 'BOOKING_ALLOCATION',
    runningAvailableSqFt: agr2.totalAvailableSqFt,
    remarks: `Allocated to Booking ${booking3.bookingNumber} for Plot ${plotD1.plotNumber}`,
  });

  await PlotReceipt.create({
    receiptType: 'DOWNPAYMENT',
    bookingId: booking3._id,
    receiptNumber: 'RCPT-2627-003',
    amount: 352000,
    paymentMode: 'BANK_TRANSFER',
    transactionReference: 'NEFT/HDFC00019/3310',
    status: 'APPROVED',
    remarks: 'Booking downpayment received',
  });

  await plotsService.rebuildBookingInstallmentsState(booking3._id).catch(() => {});
  console.log(`  ✓ Seeded Booking 3 (${booking3.bookingNumber}) on Plot ${plotD1.plotNumber} (D-Series 1600 SqFt).`);

  // 4. Booking 4: Plot C-001 (1200 sqft, 30x40, Sourced from Agreement Pool AGR-2627-001)
  const plotC1 = createdPlotsC[0];
  const booking4 = await PlotBooking.create({
    bookingNumber: 'PB-2627-004',
    bookingDate: new Date('2026-07-12'),
    customerId: createdCustomers[3]._id,
    sponsorId: createdCustomers[3].sponsorId || sponsorUsers[3]._id,
    plotId: plotC1._id,
    plotValue: 1200000,
    scheme: 'MONTHLY_INSTALLMENT',
    tenureMonths: 48,
    downpaymentMonths: 1,
    downpaymentAmount: 240000,
    bookingAmount: 240000,
    remainingAmount: 960000,
    emiMonthlyAmount: 20000,
    status: 'ACTIVE',
    agreementNumber: 'PAGR-2627-004',
    landSourcing: [
      {
        sourceType: 'AGREEMENT',
        agreementId: agr1._id,
        agreementNumber: agr1.agreementNumber,
        mauja: agr1.landParcels[1]?.mauja || 'Rampur',
        khataNumber: agr1.landParcels[1]?.khataNumber || '104',
        khesraNumber: agr1.landParcels[1]?.khesraNumber || '585',
        allocatedSqFt: 1200,
        allocatedDismil: Math.round((1200 / 435.6) * 100) / 100,
      },
    ],
    notes: 'Booked by Vikram Patel on Plot C-001 (30x40 Standard Residential).',
  });

  plotC1.status = 'BOOKED';
  await plotC1.save();

  agr1.totalAllocatedSqFt = (agr1.totalAllocatedSqFt || 0) + 1200;
  agr1.totalAvailableSqFt = Math.max(0, agr1.totalSqFt - agr1.totalAllocatedSqFt);
  await agr1.save();

  await LandStockLedger.create({
    agreementId: agr1._id,
    sourceType: 'AGREEMENT',
    bookingId: booking4._id,
    bookingNumber: booking4.bookingNumber,
    customerName: createdCustomers[3].name,
    plotNumber: plotC1.plotNumber,
    date: new Date('2026-07-12'),
    entryType: 'DEBIT',
    sqFt: 1200,
    dismil: 1200 / 435.6,
    transactionType: 'BOOKING_ALLOCATION',
    runningAvailableSqFt: agr1.totalAvailableSqFt,
    remarks: `Allocated to Booking ${booking4.bookingNumber} from Agreement Pool for Plot ${plotC1.plotNumber}`,
  });

  await PlotReceipt.create({
    receiptType: 'DOWNPAYMENT',
    bookingId: booking4._id,
    receiptNumber: 'RCPT-2627-004',
    amount: 240000,
    paymentMode: 'BANK_TRANSFER',
    transactionReference: 'UPI/98123401/VIKRAM',
    status: 'APPROVED',
    remarks: 'Booking downpayment received',
  });

  await plotsService.rebuildBookingInstallmentsState(booking4._id).catch(() => {});
  console.log(`  ✓ Seeded Booking 4 (${booking4.bookingNumber}) on Plot ${plotC1.plotNumber} (C-Series 1200 SqFt).\n`);

  console.log('════════════════════════════════════════════════════════════════');
  console.log('🎉 GOOD NATURE EMS SEEDING COMPLETED SUCCESSFULLY!');
  console.log('════════════════════════════════════════════════════════════════');
  console.log('📊 Summary of Seeded Records:');
  console.log(`  • Customers: ${createdCustomers.length}`);
  console.log(`  • Series Masters: 4 (E-Series 800sqft, A-Series 2400sqft, D-Series 1600sqft, C-Series 1200sqft)`);
  console.log(`  • Plots Generated: ${createdPlotsE.length + createdPlotsA.length + createdPlotsD.length + createdPlotsC.length}`);
  console.log(`    - E Series: 11 Plots (E-001 to E-011, 20x40)`);
  console.log(`    - A Series: 10 Plots (A-001 to A-010, 40x60)`);
  console.log(`    - D Series: 10 Plots (D-001 to D-010, 40x40)`);
  console.log(`    - C Series: 10 Plots (C-001 to C-010, 30x40)`);
  console.log(`  • Multi-Parcel Kisan Agreements: 12 (AGR-2627-001 to AGR-2627-012, 10 without deeds)
  • Registry Deeds: 2 (DEED-2026-9812, DEED-2026-4401)
  • Kisan Financial Ledger Entries: 24 (with complete Credit/Debit balance reconciliation)`);
  console.log(`  • Sample Plot Bookings: 4 (allocated across E, A, D, C series)`);
  console.log('════════════════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB.');
}

seed().catch((err) => {
  console.error('❌ Seeding failed with error:', err);
  process.exit(1);
});
