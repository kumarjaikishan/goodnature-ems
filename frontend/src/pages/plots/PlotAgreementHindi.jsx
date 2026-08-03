import React from 'react';

const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

const PlotAgreementHindi = ({
  booking,
  customer,
  plot,
  series,
  formattedDate,
  netPlotValue,
  customerName,
  downpaymentAmount,
  remainingBalanceAmount,
  installmentCount,
  standardEmiAmt,
  lastEmiAmt,
  isEmiUniform,
  regularEmiCount,
  dailyLateFineAmt,
  numberToWords
}) => {
  const khataNo = booking.khataNo || plot.khataNo || series.khataNo || '43';
  const khasraNo = booking.khasraNo || booking.khesraNo || plot.khasraNo || plot.khesraNo || series.khasraNo || '390';
  const mauzaName = booking.mauza || booking.mauzaName || plot.mauza || plot.mauzaName || series.mauza || series.mauzaName || 'सोंडीपी (Sondipi)';
  const thanaNo = booking.thanaNo || plot.thanaNo || series.thanaNo || '204';
  const rajasavThana = booking.rajasavThana || plot.rajasavThana || series.rajasavThana || 'जमुई';
  const anchalBlock = booking.anchal || booking.block || plot.anchal || plot.block || series.anchal || series.block || 'जमुई';

  const plotDimension = booking.plotDimension || plot.dimension || plot.dimensions || '30 FT x 40 FT';
  const plotArea = plot.areaSqFt || booking.plotAreaSqFt || 1200;

  const renderPageHeader = () => (
    <div className="flex justify-between items-center pb-1 mb-2 font-sans text-[0.74rem] text-slate-800 font-bold shrink-0">
      <div>
        <span>Name: <span className="uppercase">{customerName}</span></span>
      </div>
      <div>
        <span>Agreement No: <span className="uppercase">{booking.agreementNumber || booking.bookingNumber}</span></span>
      </div>
      <div>
        <span>Plot No.: <span className="uppercase font-extrabold">{plot.plotNumber || 'N/A'}{(series.seriesCode || series.seriesName) ? ` (${series.seriesCode || series.seriesName})` : ''}</span></span>
      </div>
    </div>
  );

  const renderPageFooter = (pageNum, totalPages = 4) => (
    <div className="pt-2 font-sans text-[0.74rem] text-slate-700 mt-auto shrink-0">
      <div className="flex justify-between items-end pb-1">
        <div className="text-left space-y-0.5 w-48">
          <div className="h-6 border-b border-slate-400 border-dashed w-44"></div>
          <p className="font-bold text-slate-900 m-0 text-[0.72rem]">Customer Signature</p>
          <p className="text-[0.66rem] text-slate-500 m-0 truncate">({customerName})</p>
        </div>

        <div className="text-center font-bold text-slate-800 text-[0.74rem] pb-1">
          Page {pageNum}/{totalPages}
        </div>

        <div className="text-right space-y-0.5 w-48">
          <div className="h-6 border-b border-slate-400 border-dashed w-44 ml-auto"></div>
          <p className="font-bold text-slate-900 m-0 text-[0.72rem]">Authorized Signature</p>
          <p className="text-[0.66rem] text-slate-500 m-0">(For RISEOWN Marketing Pvt. Ltd.)</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ================= PAGE 1 ================= */}
      <div className="agreement-page p-8 sm:p-10 relative h-[297mm] min-h-[297mm] flex flex-col justify-between border-b border-slate-200 print:border-none">
        <div className="h-[135mm] print:h-[135mm] w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg print:border-none mb-8 shrink-0 relative">
          <span className="text-slate-400 font-sans text-xs font-bold uppercase tracking-widest print:hidden text-center px-4">
            [ Space Reserved for Non-Judicial Stamp Paper Header Printing ]
          </span>
        </div>

        {renderPageHeader()}

        <div className="flex-1 flex flex-col justify-start space-y-4">
          <div className="text-center my-3">
            <h2 className="text-xl font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 inline-block pb-0.5 m-0">
              BUYER'S AGREEMENT
            </h2>
            <p className="text-[0.78rem] text-slate-800 mt-2 m-0 leading-relaxed">
              यह Buyer's Agreement आज तारीख <span className="font-bold">{formattedDate}</span> को Bihar Sharif में execute किया गया।
            </p>
          </div>

          <div className="space-y-3 text-justify font-sans text-[0.82rem] leading-relaxed">
            <p className="font-black text-center uppercase tracking-wider text-slate-900 mb-2 mt-4 text-[0.9rem]">
              BETWEEN
            </p>

            <div className="text-slate-900 leading-relaxed text-[0.8rem]">
              <p className="m-0">
                <span className="font-bold">M/s RISEOWN Marketing Pvt. Ltd.</span>, जो Companies Act, 2013 के तहत रजिस्टर्ड कंपनी है और जिसका रजिस्टर्ड ऑफिस Shri Krishna Nagar, Biyawani, Near Panchayat Bhawan, Bihar Sharif, Nalanda, Bihar 803118 में स्थित है, (जिसे आगे इस एग्रीमेंट में <span className="font-bold">"Company"</span> कहा जाएगा, जिसमें इसके उत्तराधिकारी और कानूनी प्रतिनिधि शामिल माने जाएंगे) — <span className="font-bold uppercase">FIRST PART (पहला पक्ष)</span>;
              </p>
            </div>

            <p className="font-black text-center uppercase tracking-wider text-slate-900 mb-2 mt-4 text-[0.9rem]">
              AND
            </p>

            <div className="text-slate-900 leading-relaxed text-[0.8rem]">
              <p className="m-0">
                {customer.gender === 'Female' ? 'Smt.' : 'Shri'} <span className="font-bold uppercase">{customerName}</span> {customer.relationType ? `${customer.relationType}` : 'Son/Daughter/Wife of'} <span className="font-bold uppercase">{customer.fatherOrHusbandName || 'N/A'}</span> Resident of <span className="font-bold">{[customer.address, customer.city, customer.state, customer.pincode].filter(Boolean).join(', ') || 'N/A'}</span>, (जिसे आगे इस एग्रीमेंट में <span className="font-bold">"Allottee"</span> / <span className="font-bold">"Buyer"</span> कहा जाएगा, जिसमें इनके वारिस, उत्तराधिकारी और कानूनी प्रतिनिधि शामिल माने जाएंगे) — <span className="font-bold uppercase">SECOND PART (दूसरा पक्ष)</span>।
              </p>
            </div>

            <div className="pt-2 text-[0.8rem] leading-relaxed text-slate-800 space-y-3">
              <p className="m-0">
                WHEREAS, Company अपना रियल एस्टेट प्रोजेक्ट <span className="font-bold">"NeelKanth City"</span> डेवलप कर रही है जो मौजा: <span className="font-bold">{mauzaName}</span>, थाना सं.: <span className="font-bold">{thanaNo}</span>, राजस्व थाना: <span className="font-bold">{rajasavThana}</span>, अंचल: <span className="font-bold">{anchalBlock}</span>, जिला <span className="font-bold">जमुई</span>, राज्य <span className="font-bold">बिहार</span> में स्थित है।
              </p>
              <p className="m-0">
                (आगे इस एग्रीमेंट में <span className="font-bold">"Company"</span> और <span className="font-bold">"Allottee"</span> दोनों को संयुक्त रूप से <span className="font-bold">"Parties"</span> और व्यक्तिगत रूप से <span className="font-bold">"Party"</span> कहा जाएगा)।
              </p>
            </div>
          </div>
        </div>

        {renderPageFooter(1, 4)}
      </div>

      {/* ================= PAGE 2 ================= */}
      <div className="agreement-page p-8 sm:p-10 relative h-[297mm] min-h-[297mm] flex flex-col justify-between border-b border-slate-200 print:border-none">
        {renderPageHeader()}

        <div className="space-y-2.5 mt-1.5 font-sans text-[0.75rem] flex-1">
          <div className="border-b border-slate-300 pb-0.5">
            <h3 className="font-black text-[0.85rem] uppercase text-slate-900 tracking-wider m-0">TERMS AND CONDITIONS (अग्रीमेंट के नियम और शर्तें)</h3>
          </div>

          {/* Clause 1 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.8rem] m-0">1. Plot Price & Payment Plan (मूल्य एवं पेमेंट प्लान)</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.74rem]">
              Company Plot No. <span className="font-bold">{plot.plotNumber}</span> (Dimension: <span className="font-bold">{plotDimension}</span> = <span className="font-bold">{plotArea} Sq.Ft.</span>, खाता सं.: <span className="font-bold">{khataNo}</span>, खसरा सं.: <span className="font-bold">{khasraNo}</span>, थाना सं.: <span className="font-bold">{thanaNo}</span>) को कुल Net Price <span className="font-bold">{formatCurrency(netPlotValue)}</span> में बेचे जाने हेतु सहमत है, जिसमें {formatCurrency(booking.discount)} का डिस्काउंट घटा दिया गया है।
              {booking.scheme === 'FULL_PAYMENT' ? (
                <> Customer ने <span className="font-semibold uppercase">One-Time Full Payment Plan</span> चुना है, जिसमें डाउन पेमेंट <span className="font-bold">{formatCurrency(downpaymentAmount)}</span> एवं शेष राशि <span className="font-bold">{formatCurrency(remainingBalanceAmount)}</span> देय है।</>
              ) : (
                <> Customer ने <span className="font-semibold uppercase">Monthly Installment (EMI) Plan</span> चुना है, जिसमें डाउन पेमेंट <span className="font-bold">{formatCurrency(downpaymentAmount)}</span> और शेष बैलेंस राशि <span className="font-bold">{formatCurrency(remainingBalanceAmount)}</span> कुल <span className="font-bold">{installmentCount} मासिक किश्तों</span> में भुगतान करना है {isEmiUniform ? (
                  <> (<span className="font-bold">{formatCurrency(standardEmiAmt)} / माह</span>)</>
                ) : (
                  <> ({regularEmiCount} EMIs <span className="font-bold">{formatCurrency(standardEmiAmt)}/माह</span> + 1 अंतिम EMI <span className="font-bold">{formatCurrency(lastEmiAmt)}</span>)</>
                )}।</>
              )}
            </p>
          </div>

          {/* Clause 2 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.8rem] m-0">2. Due Date & EMI Schedule (मासिक किश्त की नियत तिथि)</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.74rem]">
              प्रत्येक माह की <span className="font-bold">1st तारीख</span> को मासिक EMI देय होगी। Allottee निर्धारित समय सीमा के भीतर किश्त जमा करने का वचन देता है।
            </p>
          </div>

          {/* Clause 3 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.8rem] m-0">3. Grace Period & Late Fine Rules (ग्रेस पीरियड एवं लेट फाइन नियम)</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.74rem]">
              हर महीने की <span className="font-bold">14th तारीख तक Grace Period</span> रहेगा। यदि किश्त का भुगतान 14 तारीख तक कर दिया जाता है, तो कोई लेट फाइन लागू नहीं होगा। 15th तारीख या उसके पश्चात भुगतान करने पर 1st तारीख से गणना करते हुए <span className="font-bold">0.05% per day</span> की दर से दैनिक लेट फाइन शुल्क देय होगा।
              {standardEmiAmt > 0 && (
                <> आपकी regular monthly EMI <span className="font-bold">{formatCurrency(standardEmiAmt)}</span> पर daily late fine <span className="font-bold">₹{dailyLateFineAmt.toFixed(2)} / day</span> होगा (example: 15th date को payment करने पर 15 days का late fine = <span className="font-bold">₹{(15 * dailyLateFineAmt).toFixed(2)}</span> EMI के साथ pay करना होगा)।</>
              )}
            </p>
          </div>

          {/* Clause 4 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.8rem] m-0">4. Default & Cancellation Clause (भुगतान विफलता एवं डिफ़ॉल्ट रद्दीकरण)</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.74rem]">
              यदि Allottee लगातार 3 मासिक किश्तों (3 Consecutive EMIs) का भुगतान करने में विफल रहता है या 90 दिनों (90 Days) से अधिक समय तक भुगतान डिफ़ॉल्ट में रहता है, तो कंपनी को 30 दिनों का लिखित नोटिस देने के पश्चात इस आवंटन को रद्द करने का पूर्ण कानूनी अधिकार होगा।
            </p>
          </div>

          {/* Clause 5 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.8rem] m-0">5. Voluntary Cancellation & Refund Policy (ऐच्छिक रद्दीकरण एवं रिफंड नीति)</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.74rem]">
              कुल जमा राशि का <span className="font-bold">20% non-refundable Earnest Money (बयाना राशि)</span> माना जाएगा। यदि खरीदार अपनी प्लॉट बुकिंग रद्द करवाता है, तो जमा राशि में से 20% बयाना राशि एवं देय लेट फाइन काटकर बाकी शेष राशि कैंसिलेशन आवेदन जमा करने की तिथि से <span className="font-bold">3 महीने (3 Months)</span> की अवधि के भीतर बिना ब्याज के वापस की जाएगी।
            </p>
          </div>

          {/* Clause 6 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.8rem] m-0">6. Physical Possession & Registry Costs (भौतिक कब्जा एवं रजिस्ट्री)</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.74rem]">
              संपूर्ण भुगतान प्राप्त होने के पश्चात् 12 माह के भीतर प्लॉट का भौतिक कब्जा सौंप दिया जाएगा। रजिस्ट्री शुल्क, स्टाम्प ड्यूटी, रजिस्ट्रेशन फीस, लीगल शुल्क एवं नगर निगम कर का संपूर्ण खर्च Allottee द्वारा स्वयं वहन किया जाएगा।
            </p>
          </div>

          {/* Clause 7 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.8rem] m-0">7. Road Land Contribution Obligation (सड़क हेतु भूमि अंशदान नियम)</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.74rem]">
              20 फीट चौड़ी सड़कों हेतु 16 फीट रास्ता कंपनी द्वारा उपलब्ध कराया जाएगा तथा रास्ते के दोनों तरफ स्थित प्रत्येक ऑलॉटी अपने प्लॉट के अग्रभाग (Frontage) से 2-2 फीट स्थान रास्ते हेतु छोड़ेगा (16 फीट कंपनी + 2 फीट + 2 फीट दोनों तरफ के ग्राहक = कुल 20 फीट चौड़ा रास्ता)।
            </p>
          </div>

          {/* Clause 8 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.8rem] m-0">8. Customer Responsibilities & Construction Norms (ग्राहक के दायित्व एवं निर्माण नियम)</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.74rem]">
              Allottee को अपने प्लॉट की बाउंड्री स्वयं बनाए रखनी होगी। किसी भी प्रकार के अवैध/अनधिकृत निर्माण, सड़क या कॉमन एरिया में अतिक्रमण करने की सख्त मनाही होगी। Allottee स्थानीय सरकारी नियमों का पालन करेगा एवं निर्माण हेतु आवश्यक सरकारी स्वीकृतियां स्वयं प्राप्त करेगा।
            </p>
          </div>
        </div>

        {renderPageFooter(2, 4)}
      </div>

      {/* ================= PAGE 3 ================= */}
      <div className="agreement-page p-8 sm:p-10 relative h-[297mm] min-h-[297mm] flex flex-col justify-between border-b border-slate-200 print:border-none">
        {renderPageHeader()}

        <div className="space-y-2 mt-1 font-sans text-[0.74rem] flex-1">
          {/* Clause 9 */}
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-[0.8rem] m-0">9. Proposed Infrastructure & Amenities (प्रस्तावित सुविधाएं — Subject to Feasibility)</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.73rem]">
              टाउनशिप में निम्नलिखित सुविधाएं प्रस्तावित (Proposed Amenities / Subject to Feasibility and Approvals) हैं:
            </p>
            <div className="text-slate-700 text-justify space-y-1 pl-3 mt-1 mb-1.5">
              <p className="m-0 mb-1 leading-relaxed text-[0.73rem]"><span className="font-bold">(a) Roads (सड़कें):</span> 40 फीट मुख्य मार्ग एवं 20 फीट की आंतरिक शाखा सड़कें।</p>
              <p className="m-0 mb-1 leading-relaxed text-[0.73rem]"><span className="font-bold">(b) Drainage & Sewage (नाली व सीवेज):</span> 4 फीट ढकी हुई नाली एवं सीवेज ड्रेनेज नेटवर्क।</p>
              <p className="m-0 mb-1 leading-relaxed text-[0.73rem]"><span className="font-bold">(c) Green Park (पार्क):</span> निवासियों के लिए सुंदर हरित पार्क और खुला क्षेत्र।</p>
              <p className="m-0 mb-1 leading-relaxed text-[0.73rem]"><span className="font-bold">(d) Community Hall (कम्युनिटी हॉल):</span> सामाजिक आयोजनों हेतु सामुदायिक भवन।</p>
              <p className="m-0 mb-1 leading-relaxed text-[0.73rem]"><span className="font-bold">(e) Hotel Space (होटल):</span> आगंतुकों व मेहमानों के ठहराव हेतु होटल परिसर।</p>
              <p className="m-0 mb-1 leading-relaxed text-[0.73rem]"><span className="font-bold">(f) Temple / Mandir (मंदिर):</span> पूजा-अर्चना हेतु भव्य मंदिर क्षेत्र।</p>
              <p className="m-0 mb-1 leading-relaxed text-[0.73rem]"><span className="font-bold">(g) Commercial Mall (शॉपिंग मॉल):</span> दैनिक खरीदारी हेतु मार्केट व शॉपिंग कॉम्प्लेक्स।</p>
              <p className="m-0 mb-1 leading-relaxed text-[0.73rem]"><span className="font-bold">(h) Hospital (अस्पताल):</span> चिकित्सा सुविधाओं हेतु अस्पताल एवं स्वास्थ्य केंद्र।</p>
              <p className="m-0 mb-1 leading-relaxed text-[0.73rem]"><span className="font-bold">(i) School (स्कूल):</span> बच्चों की शिक्षा हेतु स्कूल परिसर।</p>
            </div>
          </div>

          {/* Clause 10 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.78rem] m-0">10. Identity & KYC Verification (पहचान व दस्तावेज़ सत्यापन)</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.71rem]">
              Allottee को वैध आधार कार्ड, पैन कार्ड एवं पहचान प्रमाण जमा करना अनिवार्य है। प्रस्तुत दस्तावेज़ या घोषणापत्र फर्जी पाए जाने पर आवंटन तुरंत रद्द कर दिया जाएगा।
            </p>
          </div>

          {/* Clause 11 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.78rem] m-0">11. Nomination & Legal Heir Rules (नॉमिनी हस्तांतरण नियम)</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.71rem]">
              Allottee द्वारा नामांकित व्यक्ति (Nominee): <span className="font-bold">{customer.nominee?.name || 'N/A'}</span> (सम्बन्ध: <span className="font-bold">{customer.nominee?.relation || 'N/A'}</span>{customer.nominee?.age ? `, उम्र: ${customer.nominee.age} वर्ष` : ''}) दर्ज है। Allottee के निधन की स्थिति में अधिकार कानूनी सत्यापन व विधिक वारिस प्रमाण पत्र (Legal Heir Certificate) के पश्चात ही हस्तांतरित होंगे।
            </p>
          </div>

          {/* Clause 12 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.78rem] m-0">12. Resale & Trademark Restrictions (पुनर्विक्रय एवं ट्रेडमार्क प्रतिबंध)</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.71rem]">
              Allottee रीसेल विज्ञापन में कंपनी के नाम/लोगो का उपयोग नहीं कर सकता। कंपनी की लिखित NOC के बिना प्लॉट का पुनर्विक्रय/हस्तांतरण मान्य नहीं होगा।
            </p>
          </div>

          {/* Clause 13 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.78rem] m-0">13. Entire Agreement & Oral Representations (संपूर्ण अनुबंध नियम)</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.71rem]">
              यह दस्तावेज़ कंपनी और Allottee के बीच संपूर्ण अनुबंध (Entire Agreement) का गठन करता है। इस एग्रीमेंट में लिखित शर्तों के अलावा किसी भी एजेंट या सेल्स एग्जीक्यूटिव द्वारा दिए गए मौखिक वादे, विज्ञापन या आश्वासन कंपनी पर बाध्यकारी नहीं होंगे।
            </p>
          </div>

          {/* Clause 14 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.78rem] m-0">14. Change of Contact Details & Digital Notices (संपर्क बदलाव एवं डिजिटल नोटिस)</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.71rem]">
              Allottee को पते, मोबाइल नंबर या ईमेल में बदलाव की सूचना 30 दिनों के भीतर कंपनी को देना अनिवार्य होगा। पंजीकृत पते पर डाक द्वारा या पंजीकृत मोबाइल/ईमेल पर SMS, WhatsApp अथवा ईमेल नोटिस को वैध तामील (Validly Served Notice) माना जाएगा।
            </p>
          </div>

          {/* Clause 15 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.78rem] m-0">15. Force Majeure (इमरजेंसी परिस्थिति)</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.71rem]">
              कब्जा देना प्राकृतिक आपदा या अदालती आदेश पर निर्भर होगा। अनहोनी कारण से प्रोजेक्ट रुकने पर कंपनी की जिम्मेदारी जमा राशि 10.40% साधारण ब्याज के साथ वापस करने तक सीमित होगी।
            </p>
          </div>

          {/* Clause 16 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.78rem] m-0">16. Dispute Resolution & Arbitration (विवाद निवारण एवं मध्यस्थता)</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.71rem]">
              विवाद की स्थिति में सर्वप्रथम आपसी बातचीत, तत्पश्चात कंपनी द्वारा नियुक्त Sole Arbitrator द्वारा मध्यस्थता की जाएगी। कानूनी क्षेत्राधिकार केवल बिहार शरीफ, नालंदा (बिहार) अदालत का होगा।
            </p>
          </div>

          <div className="border-b border-slate-300 pb-0.5 pt-0.5">
            <h3 className="font-black text-[0.8rem] uppercase text-slate-900 tracking-wider m-0">ANNEXURE I — PLOT & PAYMENT DETAILS (प्लॉट और पेमेंट विवरण)</h3>
          </div>

          {/* Summary Table */}
          <table className="w-full border-collapse text-[0.71rem] border border-slate-300">
            <tbody>
              <tr className="border-b border-slate-200 bg-slate-50">
                <td className="p-1 font-bold border-r border-slate-200 w-1/5">Booking No (बुकिंग सं.):</td>
                <td className="p-1 font-semibold w-3/10">{booking.bookingNumber}</td>
                <td className="p-1 font-bold border-r border-slate-200 w-1/5">Plot No. & Area:</td>
                <td className="p-1 font-semibold w-3/10">Plot #{plot.plotNumber} ({plotArea} Sq.Ft.)</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-1 font-bold border-r border-slate-200">Plot Dimension (डायमेंशन):</td>
                <td className="p-1 font-semibold">{plotDimension}</td>
                <td className="p-1 font-bold border-r border-slate-200">Mauza (मौजा):</td>
                <td className="p-1 font-semibold">{mauzaName}</td>
              </tr>
              <tr className="border-b border-slate-200 bg-slate-50">
                <td className="p-1 font-bold border-r border-slate-200">Khata No. (खाता सं.):</td>
                <td className="p-1 font-semibold">{khataNo}</td>
                <td className="p-1 font-bold border-r border-slate-200">Khasra No. (खसरा सं.):</td>
                <td className="p-1 font-semibold">{khasraNo}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-1 font-bold border-r border-slate-200">Thana No. (थाना सं.):</td>
                <td className="p-1 font-semibold">{thanaNo}</td>
                <td className="p-1 font-bold border-r border-slate-200">Rajasav Thana (राजस्व थाना):</td>
                <td className="p-1 font-semibold">{rajasavThana}</td>
              </tr>
              <tr className="border-b border-slate-200 bg-slate-50">
                <td className="p-1 font-bold border-r border-slate-200">Anchal (अंचल):</td>
                <td className="p-1 font-semibold">{anchalBlock}</td>
                <td className="p-1 font-bold border-r border-slate-200">Project:</td>
                <td className="p-1 font-semibold">NeelKanth City</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-1 font-bold border-r border-slate-200">Payment Plan:</td>
                <td className="p-1 font-semibold uppercase">{booking.scheme === 'FULL_PAYMENT' ? 'Full Payment Plan' : 'Monthly EMI Plan'}</td>
                <td className="p-1 font-bold border-r border-slate-200">Total Plot Value:</td>
                <td className="p-1 font-bold text-slate-900">{formatCurrency(booking.plotValue)}</td>
              </tr>
              <tr className="border-b border-slate-200 bg-slate-50">
                <td className="p-1 font-bold border-r border-slate-200">Discount:</td>
                <td className="p-1 font-bold text-slate-900">{formatCurrency(booking.discount)}</td>
                <td className="p-1 font-bold border-r border-slate-200">Net Payable Price:</td>
                <td className="p-1 font-bold text-slate-900">{formatCurrency(netPlotValue)}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-1 font-bold border-r border-slate-200">Down Payment:</td>
                <td className="p-1 font-bold text-slate-900">{formatCurrency(downpaymentAmount)}</td>
                <td className="p-1 font-bold border-r border-slate-200">Remaining EMI Balance:</td>
                <td className="p-1 font-bold text-slate-900">{formatCurrency(remainingBalanceAmount)}</td>
              </tr>
              <tr>
                <td className="p-1 font-bold border-r border-slate-200">Installments / EMI:</td>
                <td className="p-1 font-semibold" colSpan="3">
                  {booking.scheme === 'MONTHLY_INSTALLMENT' ? (
                    isEmiUniform ? (
                      <>({installmentCount} EMIs @ {formatCurrency(standardEmiAmt)}/mo)</>
                    ) : (
                      <>({installmentCount} EMIs: {regularEmiCount} @ {formatCurrency(standardEmiAmt)} + 1 @ {formatCurrency(lastEmiAmt)})</>
                    )
                  ) : (
                    <>(Full Payment Scheme)</>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {renderPageFooter(3, 4)}
      </div>

      {/* ================= PAGE 4 ================= */}
      <div className="agreement-page p-8 sm:p-10 relative h-[297mm] min-h-[297mm] flex flex-col justify-between border-b border-slate-200 print:border-none">
        {renderPageHeader()}

        <div className="space-y-6 mt-6 font-sans text-[0.78rem] flex-1">
          <div className="border-b border-slate-300 pb-1.5">
            <h3 className="font-black text-sm uppercase text-slate-900 tracking-wider m-0">EXECUTION & SIGNATURE (हस्ताक्षर एवं स्वीकृति)</h3>
            <p className="text-slate-650 text-[0.72rem] mt-0.5 m-0">
              दोनों पक्षों ने ऊपर दी गई तारीख पर इस Buyer's Agreement पर अपनी पूर्ण सहमति से हस्ताक्षर किए हैं।
            </p>
          </div>

          {/* Signature Grid */}
          <div className="grid grid-cols-2 gap-6 pt-2">
            {/* Company Side */}
            <div className="border border-slate-300 p-5 rounded space-y-16 bg-slate-50/50">
              <div>
                <p className="font-black text-slate-900 uppercase text-[0.78rem] m-0">FOR & ON BEHALF OF COMPANY</p>
                <p className="text-slate-700 font-bold text-[0.74rem] mt-1 m-0">RISEOWN MARKETING PRIVATE LIMITED</p>
              </div>

              <div className="pt-6 border-t border-slate-400">
                <p className="font-bold text-slate-900 m-0 text-[0.76rem]">( Authorized Signatory / Director )</p>
                <p className="text-[0.68rem] text-slate-500 mt-0.5 m-0">Company Seal & Stamp</p>
              </div>
            </div>

            {/* Allottee Side */}
            <div className="border border-slate-300 p-5 rounded space-y-16 bg-slate-50/50">
              <div>
                <p className="font-black text-slate-900 uppercase text-[0.78rem] m-0">FOR & ON BEHALF OF CUSTOMER</p>
                <p className="text-slate-700 font-bold text-[0.74rem] mt-1 m-0">{customerName}</p>
              </div>

              <div className="pt-6 border-t border-slate-400 flex justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900 m-0 text-[0.76rem]">( Signature of 1st Applicant )</p>
                  <p className="text-[0.68rem] text-slate-500 mt-0.5 m-0">Name: {customerName}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900 m-0 text-[0.76rem]">( Signature of Co-Applicant )</p>
                  <p className="text-[0.68rem] text-slate-500 mt-0.5 m-0">Name: ____________________</p>
                </div>
              </div>
            </div>
          </div>

          {/* Witnesses Section */}
          <div className="border border-slate-300 p-5 rounded space-y-4">
            <h4 className="font-bold text-slate-900 text-[0.78rem] uppercase m-0 border-b border-slate-200 pb-1.5">WITNESSES (गवाह)</h4>

            <div className="grid grid-cols-2 gap-8 text-[0.76rem]">
              <div className="space-y-3">
                <p className="font-black text-slate-900 m-0 text-[0.78rem]">1. WITNESS NO. 1</p>
                <div className="space-y-2.5 text-[0.74rem]">
                  <p className="m-0">Signature: _________________________________</p>
                  <p className="m-0">Name: _____________________________________</p>
                  <p className="m-0">Address: ___________________________________</p>
                  <p className="m-0">Mobile: ____________________________________</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-black text-slate-900 m-0 text-[0.78rem]">2. WITNESS NO. 2</p>
                <div className="space-y-2.5 text-[0.74rem]">
                  <p className="m-0">Signature: _________________________________</p>
                  <p className="m-0">Name: _____________________________________</p>
                  <p className="m-0">Address: ___________________________________</p>
                  <p className="m-0">Mobile: ____________________________________</p>
                </div>
              </div>
            </div>
          </div>

          {/* Official Footer Disclaimer */}
          <div className="bg-slate-100 p-3 rounded border border-slate-200 text-center text-[0.72rem] text-slate-600 leading-normal">
            यह Agreement 2 copies में sign किया गया है। 1 copy Company के पास रहेगी और 2nd copy Customer को दे दी गई है।
            <br />
            <span className="font-bold text-slate-800">RISEOWN Marketing Pvt. Ltd. — Corporate Office: Bihar Sharif, Nalanda, Bihar - 803118</span>
          </div>
        </div>

        {renderPageFooter(4, 4)}
      </div>
    </>
  );
};

export default PlotAgreementHindi;
