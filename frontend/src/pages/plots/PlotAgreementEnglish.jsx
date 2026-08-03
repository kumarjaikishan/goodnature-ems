import React from 'react';

const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

const PlotAgreementEnglish = ({
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
  const mauzaName = booking.mauza || booking.mauzaName || plot.mauza || plot.mauzaName || series.mauza || series.mauzaName || 'Sondipi';
  const thanaNo = booking.thanaNo || plot.thanaNo || series.thanaNo || '204';
  const rajasavThana = booking.rajasavThana || plot.rajasavThana || series.rajasavThana || 'Jamui';
  const anchalBlock = booking.anchal || booking.block || plot.anchal || plot.block || series.anchal || series.block || 'Jamui';

  const plotDimension = booking.plotDimension || plot.dimension || plot.dimensions || '30 FT x 40 FT';
  const plotArea = plot.areaSqFt || booking.plotAreaSqFt || 1200;

  const renderPageHeader = () => (
    <div className="flex justify-between items-center pb-1 mb-2 font-sans text-[0.74rem] text-slate-800 font-bold shrink-0">
      <div>
        <span>Name: <span className="uppercase">{customerName}</span></span>
      </div>
      <div>
        <span>Agreement No.: <span className="uppercase">{booking.agreementNumber || booking.bookingNumber}</span></span>
      </div>
      <div>
        <span>Plot: <span className="uppercase font-extrabold">{plot.plotNumber || 'N/A'}{(series.seriesCode || series.seriesName) ? ` (${series.seriesCode || series.seriesName})` : ''}</span></span>
      </div>
    </div>
  );

  const renderPageFooter = (pageNum, totalPages = 4) => (
    <div className="pt-2 font-sans text-[0.74rem] text-slate-700 mt-auto shrink-0">
      <div className="flex justify-between items-end pb-1">
        <div className="text-left space-y-0.5 w-48">
          <div className="h-6 border-b border-slate-400 border-dashed w-44"></div>
          <p className="font-bold text-slate-900 m-0 text-[0.72rem]">Applicant Signature</p>
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
              THIS BUYER'S AGREEMENT (hereinafter also referred to as the 'Agreement') is executed at Bihar Sharif on this <span className="font-bold underline">{formattedDate}</span>.
            </p>
          </div>

          <div className="space-y-6 text-justify font-sans text-[0.82rem] leading-relaxed">
            <p className="font-black text-center uppercase tracking-wider text-slate-900 my-4 text-[0.9rem]">
              BY AND BETWEEN
            </p>

            <div className="text-slate-900 leading-relaxed text-[0.8rem]">
              <p className="m-0">
                <span className="font-bold">M/s RISEOWN Marketing Pvt. Ltd.</span>, a company incorporated under the provisions of the Companies Act, 2013 and having its registered office at Shri Krishna Nagar, Biyawani, Near Panchayat Bhawan, Bihar Sharif, Nalanda, Bihar 803118, (hereinafter referred to as the <span className="font-bold">"Company"</span>, which expression shall, unless it be repugnant to the context or meaning thereof, be deemed to include its successors and assigns) of the <span className="font-bold uppercase">FIRST PART</span>;
              </p>
            </div>

            <p className="font-black text-center uppercase tracking-wider text-slate-900 my-4 text-[0.9rem]">
              AND
            </p>

            <div className="text-slate-900 leading-relaxed text-[0.8rem]">
              <p className="m-0">
                {customer.gender === 'Female' ? 'Smt.' : 'Shri'} <span className="font-bold uppercase">{customerName}</span> {customer.relationType ? `${customer.relationType}` : 'Son/Daughter/Wife of'} <span className="font-bold uppercase">{customer.fatherOrHusbandName || 'N/A'}</span> Resident of <span className="font-bold">{[customer.address, customer.city, customer.state, customer.pincode].filter(Boolean).join(', ') || 'N/A'}</span>, (Hereinafter singly referred to as the <span className="font-bold">"Allottee"</span>, which expression shall, unless it be repugnant to the context or meaning thereof, be deemed to include his/her/their heirs, administrators, executors, successors and permitted assigns) of the <span className="font-bold uppercase">SECOND PART</span>.
              </p>
            </div>

            <div className="pt-2 text-[0.8rem] leading-relaxed text-slate-800 space-y-3">
              <p className="m-0">
                WHEREAS, the Company is developing the real estate project under the name and style of <span className="font-bold">"NeelKanth City"</span> located in revenue estate of Mauza: <span className="font-bold">{mauzaName}</span>, Thana No.: <span className="font-bold">{thanaNo}</span>, Rajasav Thana: <span className="font-bold">{rajasavThana}</span>, Anchal: <span className="font-bold">{anchalBlock}</span>, District <span className="font-bold">Jamui</span>, State <span className="font-bold">Bihar</span>.
              </p>
              <p className="m-0">
                (Hereinafter, the 'Company' and the 'Allottee' are collectively referred to as the <span className="font-bold">"Parties"</span> and individually as a <span className="font-bold">"Party"</span>, as the context demands).
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
            <h3 className="font-black text-[0.85rem] uppercase text-slate-900 tracking-wider m-0">TERMS AND CONDITIONS OF ALLOTMENT</h3>
          </div>

          {/* Clause 1 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.8rem] m-0">1. SALE CONSIDERATION & PAYMENT SCHEME</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.74rem]">
              The Company agrees to sell and the Allottee agrees to purchase Plot No. <span className="font-bold">{plot.plotNumber}</span> (Dimension: <span className="font-bold">{plotDimension}</span> = <span className="font-bold">{plotArea} SQFT</span>, Khata No. <span className="font-bold">{khataNo}</span>, Khasra No. <span className="font-bold">{khasraNo}</span>, Thana No. <span className="font-bold">{thanaNo}</span>) for Net Sale Price of <span className="font-bold">{formatCurrency(netPlotValue)}</span> ({numberToWords(netPlotValue)}) after deducting agreed discount of {formatCurrency(booking.discount)}.
              {booking.scheme === 'FULL_PAYMENT' ? (
                <> The Allottee has selected the <span className="font-semibold uppercase">One-Time Full Payment Scheme</span> with advance payment of <span className="font-bold">{formatCurrency(downpaymentAmount)}</span> and remaining dues of <span className="font-bold">{formatCurrency(remainingBalanceAmount)}</span>.</>
              ) : (
                <> The Allottee has selected the <span className="font-semibold uppercase">Monthly Installment Scheme</span> with downpayment of <span className="font-bold">{formatCurrency(downpaymentAmount)}</span> and remaining balance of <span className="font-bold">{formatCurrency(remainingBalanceAmount)}</span> payable in <span className="font-bold">{installmentCount} monthly EMI installments</span> {isEmiUniform ? (
                  <>of <span className="font-bold">{formatCurrency(standardEmiAmt)} / month</span></>
                ) : (
                  <>({regularEmiCount} EMIs of <span className="font-bold">{formatCurrency(standardEmiAmt)}/month</span> + 1 final EMI of <span className="font-bold">{formatCurrency(lastEmiAmt)}</span>)</>
                )}.</>
              )}
            </p>
          </div>

          {/* Clause 2 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.8rem] m-0">2. DUE DATES & INSTALLMENT SCHEDULE</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.74rem]">
              Monthly EMI installments shall be due on the <span className="font-bold">1st day of every calendar month</span>. The Allottee undertakes to adhere strictly to the payment schedule.
            </p>
          </div>

          {/* Clause 3 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.8rem] m-0">3. GRACE PERIOD & LATE FINE RATE</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.74rem]">
              A grace period is granted till the <span className="font-bold">14th day of the month</span>. If installment is paid on or before the 14th day, no late fine shall apply. For payments made on or after 15th day, a daily late fine of <span className="font-bold">0.05% per day</span> calculated from 1st day of the month shall be levied along with EMI.
              {standardEmiAmt > 0 && (
                <> For your regular monthly EMI of <span className="font-bold">{formatCurrency(standardEmiAmt)}</span>, daily late fine rate is <span className="font-bold">₹{dailyLateFineAmt.toFixed(2)} / day</span> (e.g., payment on 15th incurs 15 days late fine = <span className="font-bold">₹{(15 * dailyLateFineAmt).toFixed(2)}</span> along with regular EMI).</>
              )}
            </p>
          </div>

          {/* Clause 4 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.8rem] m-0">4. DEFAULT & PAYMENT FAILURE CANCELLATION</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.74rem]">
              If the Allottee fails to pay three consecutive EMIs or remains in default for more than 90 days, the Company shall have the absolute right to cancel the allotment after serving a 30-day written notice.
            </p>
          </div>

          {/* Clause 5 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.8rem] m-0">5. VOLUNTARY CANCELLATION & REFUND POLICY</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.74rem]">
              An amount equivalent to <span className="font-bold">20% of the total received amount</span> constitutes non-refundable Earnest Money. Upon voluntary cancellation by the Allottee, 20% Earnest Money and accrued late fine shall be deducted, and balance refund amount (if any) shall be returned without interest within a <span className="font-bold">3-Month period</span> from date of submission of cancellation application.
            </p>
          </div>

          {/* Clause 6 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.8rem] m-0">6. POSSESSION & STAMP DUTY / REGISTRATION</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.74rem]">
              Physical possession of the Plot shall be delivered within 12 months from execution upon full receipt of total sale price. All charges for stamp duty, sale deed registration fees, municipal taxes, and legal expenses shall be borne exclusively by the Allottee.
            </p>
          </div>

          {/* Clause 7 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.8rem] m-0">7. ROAD LAND CONTRIBUTION OBLIGATION</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.74rem]">
              For 20ft roads, Company shall provide 16ft width of road space, and each facing Allottee on either side shall contribute 2ft of land from their plot frontage towards road (16ft Company + 2ft + 2ft facing customers = total 20ft wide road).
            </p>
          </div>

          {/* Clause 8 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.8rem] m-0">8. CUSTOMER RESPONSIBILITIES & CONSTRUCTION NORMS</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.74rem]">
              The Allottee shall maintain plot boundaries, refrain from illegal/unauthorized construction, avoid encroaching roads/common areas, obey local municipal laws, and obtain necessary statutory building approvals prior to construction.
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
            <h4 className="font-bold text-slate-900 text-[0.8rem] m-0">9. PROPOSED INFRASTRUCTURE & AMENITIES (Subject to Feasibility)</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.73rem]">
              The township project includes the following proposed infrastructure and amenities (Subject to feasibility and authority approvals):
            </p>
            <div className="text-slate-700 text-justify space-y-1 pl-3 mt-1 mb-1.5">
              <p className="m-0 mb-1 leading-relaxed text-[0.73rem]"><span className="font-bold">(a) Roads:</span> 40ft main road and 20ft internal branch roads.</p>
              <p className="m-0 mb-1 leading-relaxed text-[0.73rem]"><span className="font-bold">(b) Drainage & Sewage:</span> 4ft covered drainage and underground sewage network.</p>
              <p className="m-0 mb-1 leading-relaxed text-[0.73rem]"><span className="font-bold">(c) Green Park:</span> Beautiful green park and open space for fresh air.</p>
              <p className="m-0 mb-1 leading-relaxed text-[0.73rem]"><span className="font-bold">(d) Community Hall:</span> Community hall for social functions and events.</p>
              <p className="m-0 mb-1 leading-relaxed text-[0.73rem]"><span className="font-bold">(e) Hotel Space:</span> Designated space for proposed commercial hotel.</p>
              <p className="m-0 mb-1 leading-relaxed text-[0.73rem]"><span className="font-bold">(f) Temple / Mandir:</span> Temple complex for community worship.</p>
              <p className="m-0 mb-1 leading-relaxed text-[0.73rem]"><span className="font-bold">(g) Commercial Mall:</span> Shopping complex and market area for daily needs.</p>
              <p className="m-0 mb-1 leading-relaxed text-[0.73rem]"><span className="font-bold">(h) Hospital:</span> Healthcare center and hospital area for medical needs.</p>
              <p className="m-0 mb-1 leading-relaxed text-[0.73rem]"><span className="font-bold">(i) School:</span> Earmarked school campus area for children's education.</p>
            </div>
          </div>

          {/* Clause 10 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.78rem] m-0">10. IDENTITY & KYC VERIFICATION</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.71rem]">
              The Allottee must submit valid Aadhaar, PAN card, and identity proofs. If submitted documents or declarations are found false or fraudulent, the Company reserves the right to cancel the allotment immediately.
            </p>
          </div>

          {/* Clause 11 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.78rem] m-0">11. NOMINATION & LEGAL HEIR RULES</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.71rem]">
              The Nominee nominated by the Allottee is: <span className="font-bold">{customer.nominee?.name || 'N/A'}</span> (Relation: <span className="font-bold">{customer.nominee?.relation || 'N/A'}</span>{customer.nominee?.age ? `, Age: ${customer.nominee.age} yrs` : ''}). Nominee details are recorded for reference. In the event of Allottee's demise, allotment rights shall be transferred to nominee/legal heir only upon statutory legal verification and production of a Legal Heir Certificate.
            </p>
          </div>

          {/* Clause 12 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.78rem] m-0">12. RESALE & TRADEMARK RESTRICTIONS</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.71rem]">
              The Allottee shall not advertise or use Company name/logo for resale. No resale or transfer of plot shall be valid without obtaining prior written NOC from the Company.
            </p>
          </div>

          {/* Clause 13 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.78rem] m-0">13. ENTIRE AGREEMENT & ORAL REPRESENTATIONS</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.71rem]">
              This Agreement constitutes the entire agreement between the Company and the Allottee. Any oral promises, advertisements, assurances, or representations made by any agent or executive not specifically written in this Agreement shall not be binding on the Company.
            </p>
          </div>

          {/* Clause 14 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.78rem] m-0">14. CHANGE OF CONTACT DETAILS & DIGITAL NOTICES</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.71rem]">
              The Allottee shall inform the Company within 30 days of any change in address, mobile number, email, or contact details. Notices sent through Registered Post, Email, SMS, or WhatsApp to the last registered contact details shall be deemed validly served.
            </p>
          </div>

          {/* Clause 15 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.78rem] m-0">15. FORCE MAJEURE & EMERGENCY CLAUSE</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.71rem]">
              Possession timeline is subject to force majeure, acts of God, or court orders. In case of project abandonment due to force majeure, Company's liability is limited to refunding received principal with 10.40% simple interest.
            </p>
          </div>

          {/* Clause 16 */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-[0.78rem] m-0">16. DISPUTE RESOLUTION: NEGOTIATION & ARBITRATION</h4>
            <p className="text-slate-700 text-justify m-0 leading-relaxed text-[0.71rem]">
              Any dispute shall first be settled via amicable negotiation. Unresolved disputes shall be referred to a Sole Arbitrator appointed by the Company. Courts at Bihar Sharif, Nalanda, Bihar shall have exclusive jurisdiction.
            </p>
          </div>

          <div className="border-b border-slate-300 pb-0.5 pt-0.5">
            <h3 className="font-black text-[0.8rem] uppercase text-slate-900 tracking-wider m-0">ANNEXURE I — PLOT & PAYMENT SUMMARY</h3>
          </div>

          {/* Summary Table */}
          <table className="w-full border-collapse text-[0.71rem] border border-slate-300">
            <tbody>
              <tr className="border-b border-slate-200 bg-slate-50">
                <td className="p-1 font-bold border-r border-slate-200 w-1/5">Booking No.:</td>
                <td className="p-1 font-semibold w-3/10">{booking.bookingNumber}</td>
                <td className="p-1 font-bold border-r border-slate-200 w-1/5">Plot Number & Size:</td>
                <td className="p-1 font-semibold w-3/10">Plot #{plot.plotNumber} ({plotArea} SQFT)</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-1 font-bold border-r border-slate-200">Plot Dimension:</td>
                <td className="p-1 font-semibold">{plotDimension}</td>
                <td className="p-1 font-bold border-r border-slate-200">Mauza:</td>
                <td className="p-1 font-semibold">{mauzaName}</td>
              </tr>
              <tr className="border-b border-slate-200 bg-slate-50">
                <td className="p-1 font-bold border-r border-slate-200">Khata No.:</td>
                <td className="p-1 font-semibold">{khataNo}</td>
                <td className="p-1 font-bold border-r border-slate-200">Khasra No.:</td>
                <td className="p-1 font-semibold">{khasraNo}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-1 font-bold border-r border-slate-200">Thana No.:</td>
                <td className="p-1 font-semibold">{thanaNo}</td>
                <td className="p-1 font-bold border-r border-slate-200">Rajasav Thana:</td>
                <td className="p-1 font-semibold">{rajasavThana}</td>
              </tr>
              <tr className="border-b border-slate-200 bg-slate-50">
                <td className="p-1 font-bold border-r border-slate-200">Anchal / Block:</td>
                <td className="p-1 font-semibold">{anchalBlock}</td>
                <td className="p-1 font-bold border-r border-slate-200">Project:</td>
                <td className="p-1 font-semibold">NeelKanth City</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-1 font-bold border-r border-slate-200">Payment Scheme:</td>
                <td className="p-1 font-semibold uppercase">{booking.scheme?.replace('_', ' ')}</td>
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
                <td className="p-1 font-bold border-r border-slate-200">EMI Balance:</td>
                <td className="p-1 font-bold text-slate-900">{formatCurrency(remainingBalanceAmount)}</td>
              </tr>
              <tr>
                <td className="p-1 font-bold border-r border-slate-200">Installments / EMI:</td>
                <td className="p-1 font-semibold" colSpan="3">
                  {booking.scheme === 'MONTHLY_INSTALLMENT' ? (
                    isEmiUniform ? (
                      <>{installmentCount} EMIs @ {formatCurrency(standardEmiAmt)}/mo</>
                    ) : (
                      <>{installmentCount} EMIs ({regularEmiCount} @ {formatCurrency(standardEmiAmt)} + 1 @ {formatCurrency(lastEmiAmt)})</>
                    )
                  ) : (
                    <>N/A (One-Time Scheme)</>
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
            <h3 className="font-black text-sm uppercase text-slate-900 tracking-wider m-0">EXECUTION & ACKNOWLEDGEMENT</h3>
            <p className="text-slate-650 text-[0.72rem] mt-0.5 m-0">
              IN WITNESS WHEREOF, the Parties hereto have set their hands and seal to this Buyer's Agreement on the day, month, and year first written above.
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
                <p className="font-black text-slate-900 uppercase text-[0.78rem] m-0">FOR & ON BEHALF OF ALLOTTEE</p>
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
            <h4 className="font-bold text-slate-900 text-[0.78rem] uppercase m-0 border-b border-slate-200 pb-1.5">WITNESSES</h4>

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
            This Agreement is executed in duplicate. One copy is retained by the Company and the second copy is handed over to the Allottee.
            <br />
            <span className="font-bold text-slate-800">RISEOWN Marketing Pvt. Ltd. — Corporate Office: Bihar Sharif, Nalanda, Bihar - 803118</span>
          </div>
        </div>

        {renderPageFooter(4, 4)}
      </div>
    </>
  );
};

export default PlotAgreementEnglish;
