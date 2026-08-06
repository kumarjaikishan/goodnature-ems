import React from 'react';

const formatCurrency = (amount) => `Rs. ${Number(amount || 0).toLocaleString('en-IN')}.00/-`;

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
  const companyName = booking.companyName || 'M/s Good Nature Projects Pvt. Ltd.';
  const companyAddress = 'Raj Bhawan, ManglaSthan, Ramchandrapur, Near Bus Stand, Bihar Shariff, Bihar - 803101';

  const khataNo = booking.khataNo || plot.khataNo || series.khataNo || '53';
  const khasraNo = booking.khasraNo || plot.khasraNo || plot.plotNumber || '270';
  const mauzaName = booking.mauza || booking.mauzaName || plot.mauza || plot.mauzaName || series.mauza || series.mauzaName || 'SAMSERA';
  const thanaNo = booking.thanaNo || plot.thanaNo || series.thanaNo || 'RAJGIR';
  const cityRajgir = booking.city || plot.city || series.city || 'RAJGIR';
  const districtNalanda = booking.district || plot.district || series.district || 'Nalanda';
  const stateBihar = booking.state || plot.state || series.state || 'Bihar';
  const projectName = series.seriesName || series.projectName || plot.projectName || 'NALANDA NEW CITY';
  const projectArea = series.projectArea || '19.5 Acres Approx.';

  const plotDimension = booking.plotDimension || plot.dimension || plot.dimensions || '[NW-NE] 40 X [SW-SE] 40 X [NE-SE] 30 X [NW-SW] 30 = 1200 SQFT';
  const plotArea = plot.areaSqFt || booking.plotAreaSqFt || 1200;
  const applicationNo = booking.applicationNo || booking.bookingNumber || '0686';
  const planCode = series.seriesCode || series.planCode || booking.planCode || 'NNNC/ROW/B2';

  return (
    <div className="text-slate-900 font-sans leading-relaxed text-[0.76rem] text-justify">

      {/* ── PAGE 1: STAMP PAPER & BY AND BETWEEN ── */}
      <div 
        className="flex flex-col justify-between h-auto print:h-[260mm] pb-2 mb-6 print:mb-0 border-b print:border-b-0 border-slate-200" 
        style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
      >
        <div className="space-y-2">
          {/* Stamp Paper Space (Page 1 Top ~80mm) */}
          <div className="h-[80mm] print:h-[80mm] w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg print:border-none mb-2 shrink-0 bg-slate-50/50">
            <span className="text-slate-400 font-sans text-xs font-bold uppercase tracking-widest print:hidden text-center px-4">
              [ Space Reserved for Non-Judicial Stamp Paper Header Printing ]
            </span>
          </div>

          {/* Metadata Line */}
          <div className="flex justify-between items-center text-[0.76rem] font-bold text-slate-900 border-b border-slate-200 pb-1.5 mb-2">
            <div>Name : <span className="uppercase font-extrabold">{customerName}</span></div>
            <div>Agreement No. : <span className="uppercase font-mono font-extrabold">{booking.agreementNumber || booking.bookingNumber}</span></div>
            <div>Plan : <span className="uppercase font-extrabold">{planCode}</span></div>
          </div>

          {/* Header Title */}
          <div className="text-center my-2">
            <h2 className="text-base font-black uppercase tracking-wider text-slate-900 m-0">
              BUYER'S AGREEMENT
            </h2>
            <p className="text-[0.76rem] text-slate-800 mt-1.5 m-0 leading-relaxed">
              THIS BUYER'S AGREEMENT (hereinafter also referred to as the "Agreement") is executed at Bihar Sharif on this <span className="font-bold underline">{formattedDate}</span>.
            </p>
          </div>

          {/* Parties Section */}
          <div className="space-y-2.5 pt-1">
            <p className="font-black text-center uppercase tracking-wider text-slate-900 my-1.5 text-[0.82rem]">
              BY AND BETWEEN
            </p>

            <p className="m-0 text-[0.76rem] leading-relaxed">
              <span className="font-bold">{companyName}</span>, a company incorporated under the provisions of the Companies Act, 2013 and having its registered office at {companyAddress}, (hereinafter referred to as the <span className="font-bold">"Company"</span>, which expression shall, unless it be repugnant to the context or meaning thereof, be deemed to include its successors and assigns) of the <span className="font-bold uppercase">FIRST PART</span>;
            </p>

            <p className="font-black text-center uppercase tracking-wider text-slate-900 my-1.5 text-[0.82rem]">
              AND
            </p>

            <p className="m-0 text-[0.76rem] leading-relaxed">
              {customer.gender === 'Female' ? 'Smt.' : 'Shri/Smt.'} <span className="font-bold uppercase">{customerName}</span> {customer.relationType ? `${customer.relationType}` : 'Son/Daughter/Wife of'} <span className="font-bold uppercase">{customer.fatherOrHusbandName || 'N/A'}</span> Resident of <span className="font-bold">{[customer.address, customer.city, customer.state, customer.pincode].filter(Boolean).join(', ') || 'N/A'}</span>, (Hereinafter singly referred to as the <span className="font-bold">"Allottee"</span>, which expression shall, unless it be repugnant to the context or meaning thereof, be deemed to include his/her/their heirs, administrators, executors, successors and permitted assigns) of the <span className="font-bold uppercase">SECOND PART</span>.
            </p>

            <p className="text-[0.74rem] text-slate-800 m-0 pt-1 leading-relaxed">
              (Hereinafter, the "Company" and the "Allottee" are collectively referred to as the <span className="font-bold">"Parties"</span> and individually as a <span className="font-bold">"Party"</span>, as the context demands).
            </p>
          </div>
        </div>

        {/* Page 1 Footer & Signatures */}
        <div className="pt-4 shrink-0">
          <div className="flex justify-between items-end text-[0.72rem] font-bold text-slate-900 pb-2">
            <div>
              <div className="h-5 border-b border-dashed border-slate-400 w-36 mb-1"></div>
              <span>Applicant Signature</span>
            </div>
            <div>
              <div className="h-5 border-b border-dashed border-slate-400 w-36 ml-auto mb-1"></div>
              <span>Authorized Signature</span>
            </div>
          </div>
          <div className="text-center text-[0.72rem] font-bold text-slate-900 border-t border-slate-200 pt-1">
            Page 1
          </div>
        </div>
      </div>

      {/* ── PAGES 2+ CONTAINER TABLE (Repeats Header & Footer on Pages 2, 3, 4...) ── */}
      <table className="w-full border-collapse">
        <thead className="hidden print:table-header-group">
          <tr>
            <th className="font-normal text-left pb-2">
              <div className="font-sans pb-1.5 flex justify-between items-center text-[10px] font-bold text-slate-800 border-b border-slate-300">
                <div>Name: <span className="uppercase">{customerName}</span></div>
                <div>Agreement No.: <span className="uppercase">{booking.agreementNumber || booking.bookingNumber}</span></div>
                <div>Plot: <span className="uppercase font-extrabold">{plot.plotNumber || 'N/A'}{(series.seriesCode || series.seriesName) ? ` (${series.seriesCode || series.seriesName})` : ''}</span></div>
              </div>
            </th>
          </tr>
        </thead>

        <tfoot className="hidden print:table-footer-group">
          <tr>
            <td className="pt-2">
              <div className="font-sans pt-1 flex justify-between items-end text-[10px] text-slate-700 border-t border-slate-200">
                <div className="text-left w-48">
                  <div className="h-4 border-b border-slate-400 border-dashed w-36 mb-0.5"></div>
                  <p className="font-bold text-slate-900 m-0 text-[9px]">Applicant Signature</p>
                  <p className="text-[8px] text-slate-500 m-0 truncate">({customerName})</p>
                </div>

                <div className="text-right w-48">
                  <div className="h-4 border-b border-slate-400 border-dashed w-36 ml-auto mb-0.5"></div>
                  <p className="font-bold text-slate-900 m-0 text-[9px]">Authorized Signature</p>
                  <p className="text-[8px] text-slate-500 m-0">(For {companyName})</p>
                </div>
              </div>
            </td>
          </tr>
        </tfoot>

        <tbody>
          <tr>
            <td className="space-y-4 pt-2">
              {/* Recitals Section */}
              <div className="space-y-2.5">
                <p className="m-0">
                  <span className="font-bold">A. WHEREAS</span>, {companyName} is in the process of developing of land admeasuring area {projectArea}, located in the revenue estate of Mauza - <span className="font-bold">{mauzaName}</span>, Thana No. - <span className="font-bold">{thanaNo}</span>, City - <span className="font-bold">{cityRajgir}</span>, District - <span className="font-bold">{districtNalanda}</span>, State - <span className="font-bold">{stateBihar}</span> under the name and style of <span className="font-bold">"{projectName}"</span>, hereunder (hereinafter referred to as the "Project").
                </p>

                <p className="m-0">
                  <span className="font-bold">B. AND WHEREAS</span>, the Company is developing the said Project and further plotting of Project Land in the size of 800Sq. Ft., 1200Sq. Ft., 1600Sq. Ft., 2000Sq. Ft. and 2400Sq. Ft. respectively in accordance with project plan.
                </p>

                <p className="m-0">
                  <span className="font-bold">C. AND WHEREAS</span>, the Allottee applied to the Company vide Application No. <span className="font-bold">{applicationNo}</span>, dated <span className="font-bold">{formattedDate}</span> (hereinafter referred to as the "Application") agreeing to the terms and conditions set out therein for purchase of plot, tentatively admeasuring <span className="font-bold">{plotDimension}</span> (hereinafter referred to as the "Plot") in the Project being developed on the Project Land.
                </p>

                <p className="m-0">
                  <span className="font-bold">D. AND WHEREAS</span>, subject to fulfillment of the terms and conditions mentioned in the application and any applicable laws, rules, regulations, bye-laws or orders made pursuant thereto or otherwise applicable, the Company has approved the desired plot to the Buyer in Project, which the Buyer has agreed to purchase.
                </p>

                <p className="m-0">
                  <span className="font-bold">E. AND WHEREAS</span>, the Allottee has thoroughly inspected all the relevant deeds, documents, approvals, licenses and authorizations in relation to the Company, the Project Land, the Project, including specifically the ownership records and documents relating to the title of the aforesaid Project Land, the Project plans, the permits/licenses/consents and having satisfied itself / himself / herself with the facts as stated herein or otherwise as may be relevant in relation to the said Project or for the purposes of this Agreement, has decided to execute this Agreement and all other related or incidental deeds and documents. The Allottee confirms that the Allottee does not require any further investigations in this regard and that the Allottee is fully satisfied in all respects.
                </p>

                <p className="m-0">
                  <span className="font-bold">F. AND WHEREAS</span>, the Allottee has full knowledge of the fact that the allotment of the Plot is subject to various eligibility criteria and restrictive covenants, which the Allottee represents and warrants that he/she fully meets all the eligibility criteria and undertakes to abide by all the terms and conditions pursuant thereto and undertakes to abide by the applicable provisions and any applicable laws, rules, regulations, bye-laws or orders made pursuant thereto or otherwise applicable.
                </p>

                <p className="m-0">
                  <span className="font-bold">G. AND WHEREAS</span>, the Company has allotted the Plot in the Project Land, bearing Plan <span className="font-bold">{planCode}</span>, Khata No. <span className="font-bold">{khataNo}</span> / Plot No. <span className="font-bold">{plot.plotNumber || '270'}</span> of the said Project, on terms and conditions as stipulated hereinafter.
                </p>

                <p className="m-0">
                  <span className="font-bold">H. AND WHEREAS</span>, the Allottee has confirmed to the Company that he/she/it is entering into this Agreement with full knowledge of all the laws, rules, regulations, notifications, etc. applicable to the said development and the terms and conditions contained in this Agreement and that he/she/it has clearly understood his/her/its rights, duties, responsibilities, obligations under each and all the clauses of this Agreement.
                </p>

                <p className="m-0">
                  <span className="font-bold">I. AND WHEREAS</span>, the Company, relying on the confirmations, representations and assurances of the Allottee to faithfully abide by all the terms, conditions and stipulations contained in this Agreement has accepted in good faith his/her/its Application to allot the said Plot and is now willing to enter into this Agreement on the terms and conditions appearing hereinafter.
                </p>
              </div>

              <div className="pt-2 text-center">
                <p className="font-black text-[0.78rem] tracking-wider text-slate-900 uppercase m-0 border-t border-b border-slate-300 py-1.5">
                  NOW THEREFORE IT IS HEREBY AGREED AND DECLARED BY AND BETWEEN THE PARTIES HERETO AS FOLLOWS:
                </p>
              </div>

              {/* Clauses Section */}
              <div className="space-y-4 pt-2">
                {/* Clause 1 */}
                <div className="space-y-1.5">
                  <h4 className="font-black text-slate-900 text-[0.8rem] uppercase m-0 border-b border-slate-300 pb-0.5">1. DEFINITIONS AND INTERPRETATION</h4>

                  <h5 className="font-bold text-slate-900 text-[0.76rem] m-0 pt-1">1.1 Definitions</h5>
                  <p className="m-0 leading-relaxed">
                    In this Agreement, unless repugnant or contrary to the context hereof, the following terms, where capitalized, shall have the meanings assigned herein when used in this Agreement.
                  </p>
                  <p className="m-0 leading-relaxed">
                    <span className="font-bold">"Plot"</span> shall mean and include plot of land in the Project Land, under the name and style of <span className="font-bold">"{projectName}"</span> located in revenue estate of Mauza - <span className="font-bold">{mauzaName}</span>, Thana No. - <span className="font-bold">{thanaNo}</span>, City - <span className="font-bold">{cityRajgir}</span>, District - <span className="font-bold">{districtNalanda}</span>, State - <span className="font-bold">{stateBihar}</span> of area/areas specified above, the ownership/title of which is either be in the name of the Company or in the name of Director/Directors of the Company and which is clearly located/identified in the project plan discussed and agreed with the Allottee at the time of execution of this agreement or at the time of application whatsoever the case may be.
                  </p>
                  <p className="m-0 leading-relaxed">
                    <span className="font-bold">"Common Areas & Facilities"</span> shall mean and include:
                  </p>
                  <div className="pl-3 space-y-1">
                    <p className="m-0"><span className="font-bold">A.</span> the common main road having width approx. 40ft, common internal road having width approx. 20ft (Branch Road) developed or to be developed by the Company and which is absolutely defined, located and identified in the Project Land and all easements, rights and appurtenances belonging to the road in Project;</p>
                    <p className="m-0"><span className="font-bold">B.</span> the common draining system (Drain of width approx. 4Ft), developed or to be developed by the Company and which is absolutely defined, located and identified in the Project Land and all easements, rights and appurtenances belonging to the road in Project;</p>
                    <p className="m-0"><span className="font-bold">C.</span> Community Hall, Park and all other facilities which is necessary or convenient to its existence, maintenance and safety or normally in common use.</p>
                  </div>

                  <h5 className="font-bold text-slate-900 text-[0.76rem] m-0 pt-1.5">1.2 Interpretation</h5>
                  <p className="m-0 leading-relaxed">Interpretation Unless the context otherwise requires in this Agreement:</p>
                  <div className="pl-3 space-y-0.5">
                    <p className="m-0"><span className="font-bold">A.</span> the use of words importing the singular shall include plural and masculine shall include feminine gender and vice versa;</p>
                    <p className="m-0"><span className="font-bold">B.</span> reference to any law shall include such law as from time to time be enacted, amended, supplemented or re-enacted;</p>
                    <p className="m-0"><span className="font-bold">C.</span> reference to the words "include" or "including" shall be construed without limitation;</p>
                    <p className="m-0"><span className="font-bold">D.</span> reference to this Agreement, or any other agreement, deed or other instrument or document shall be construed as reference to this Agreement or such agreement, deed or other instrument or document as the same may from time to time be amended, varied, supplemented or novated;</p>
                    <p className="m-0"><span className="font-bold">E.</span> words and abbreviations, used but not defined, which have well known technical or trade / commercial meanings are used in this Agreement in accordance with such meanings;</p>
                    <p className="m-0"><span className="font-bold">F.</span> all schedules, appendices, annexures, attachments, supplements to this Agreement shall constitute an integral part of this Agreement.</p>
                  </div>
                </div>

                {/* Clause 2 */}
                <div className="space-y-1">
                  <h4 className="font-black text-slate-900 text-[0.8rem] uppercase m-0 border-b border-slate-300 pb-0.5">2. ACCEPTANCE AND ACKNOWLEDGMENT BY THE ALLOTTEE</h4>
                  <p className="m-0 leading-relaxed">
                    The Allottee agrees that wherever in this Agreement, it is explicitly mentioned that the Allottee has understood and acknowledged the obligations of the Allottee or the rights of the Company, the Allottee has given its/her/his consent to the actions of the Company and/or the Allottee has acknowledged that the Allottee has no right or remedy of any nature whatsoever and that the Allottee, in furtherance of the same, shall do all such acts, deeds or things, as the Company may deem necessary and/or execute such documents/deeds in favour of the Company at the first request without any protest or demur as the Company may require in this regard.
                  </p>
                </div>

                {/* Clause 3 */}
                <div className="space-y-1">
                  <h4 className="font-black text-slate-900 text-[0.8rem] uppercase m-0 border-b border-slate-300 pb-0.5">3. AGREEMENT TO SELL</h4>
                  <p className="m-0 leading-relaxed">
                    In accordance with and subject to the terms and conditions set out in this Agreement, the Company hereby agrees to sell and the Allottee hereby agrees to purchase, upon payment of the Total Price and all other charges, payments and levies as are required to be paid under the terms of this Agreement or under the terms and conditions set forth in the application, the plot (having specifications set out in Annexure I) admeasuring in aggregate area of approx. (<span className="font-bold">{plotArea} SQFT</span>) earmarked and to be allotted.
                  </p>
                </div>

                {/* Clause 4 */}
                <div className="space-y-1.5">
                  <h4 className="font-black text-slate-900 text-[0.8rem] uppercase m-0 border-b border-slate-300 pb-0.5">4. TOTAL PRICE AND OTHER CHARGES PAYABLE BY THE ALLOTTEE</h4>
                  <p className="m-0 leading-relaxed">
                    <span className="font-bold">a.</span> The Allottee shall pay to the Company a total consideration of <span className="font-bold">{formatCurrency(netPlotValue)}</span> ({numberToWords(netPlotValue)}), (hereinafter referred to as the "Total Price") towards the purchase of the Plot and the provision for certain other common services/facilities within the said Project.
                  </p>
                  <p className="m-0 leading-relaxed">
                    <span className="font-bold">b.</span> Notwithstanding anything to the contrary contained in this Agreement, the Total Price is exclusive of any applicable taxes, cesses, levies or assessment and the Allottee agrees and undertakes to pay on demand all such taxes, cess, levies or assessment including VAT, service tax etc., whether already levied, or leviable now or in future in relation to the Project Land and/or construction and development of the Project or otherwise in relation to the Project as applicable to the said Plot on the date of taking over the possession of the said Plot by the Allottee.
                  </p>
                  <p className="m-0 leading-relaxed">
                    <span className="font-bold">c.</span> That the Allottee has paid to the Company a sum of <span className="font-bold">{formatCurrency(downpaymentAmount)}</span> ({numberToWords(downpaymentAmount)} of agreed sale consideration) at the time of Application and balance amount of <span className="font-bold">{formatCurrency(remainingBalanceAmount)}</span> ({numberToWords(remainingBalanceAmount)} of agreed sale consideration) is agreed to be paid as per the payment plan, described in the Annexure-I of this Agreement and as per the other applicable provisions of this Agreement. That the Allottee has chosen {installmentCount} installment plan for payment of balance agreed sale consideration and agree to pay installment of <span className="font-bold">{formatCurrency(standardEmiAmt)}</span> for a period of total {installmentCount} installments.
                  </p>
                  <p className="m-0 leading-relaxed">
                    <span className="font-bold">d.</span> Any and all payments required to be made by the Allottee hereunder shall be made through wire transfer/cheque/demand draft drawn in favour of <span className="font-bold">"{companyName}"</span>, payable at Bihar Shariff, Bihar.
                  </p>
                  <p className="m-0 leading-relaxed">
                    <span className="font-bold">e. PAYMENT OF TAXES ON LAND, WEALTH-TAX, CESSES BY ALLOTTEE</span><br />
                    The Allottee agrees and undertakes to pay all Government rates, tax on land, municipal tax, property taxes, wealth tax, taxes, buildings or other worker construction fund fees or levies of all and any kind by whatever name called, whether levied or leviable now or in future by the Government, municipal authority or any other governmental authority on the said Project and/or the Project Land as the case may be, as in case assessable or applicable from the date of the Allottee's Application and the same shall be paid on pro rata basis and the determination of proportionate share by the Company and demand thereof shall be final and binding on the Allottee. However, if the said Plot is assessed separately, the Allottee shall pay directly to the competent authority.
                  </p>
                  <p className="m-0 leading-relaxed">
                    <span className="font-bold">f. ADJUSTMENT/APPROPRIATION OF PAYMENTS</span><br />
                    The Allottee authorizes the Company to adjust/appropriate all payments that shall be made by the Allottee under any head(s) of dues against outstanding heads in Allottee's name and the Allottee shall not have a right to object/demand/direct the Company to adjust the payments in any manner otherwise than as decided by the Company.
                  </p>
                </div>

                {/* Clause 5 */}
                <div className="space-y-1.5">
                  <h4 className="font-black text-slate-900 text-[0.8rem] uppercase m-0 border-b border-slate-300 pb-0.5">5. ENTITLEMENT OF THE ALLOTTEE IN RELATION TO THE PROPERTY</h4>
                  <p className="m-0 leading-relaxed">
                    <span className="font-bold">A.</span> Subject to the terms and conditions of this Agreement and upon execution of conveyance deed, the Allottee shall have the following rights with regard to the said Plot and other rights and facilities attached thereto:
                  </p>
                  <div className="pl-3 space-y-1">
                    <p className="m-0"><span className="font-bold">I.</span> Ownership of the said Plot area;</p>
                    <p className="m-0"><span className="font-bold">II.</span> Undivided proportionate interest in and the right to use the Common Areas and Facilities within the said Project only. Since the interest of Allottee in the Common Areas and Facilities is undivided and cannot be separated, subject to timely payment of any applicable charges, the Allottee shall use the Common Areas and Facilities harmoniously along with other Plot owners, maintenance staff etc., without causing any inconvenience or hindrance/annoyance to them; and</p>
                    <p className="m-0"><span className="font-bold">III.</span> Only the right to use the general Common Areas and Facilities within the said Project, which is earmarked by the Company as commonly usable areas by all allottees of all the Plots in the Project Land. The identification by the Company of such areas shall be final and binding on the Allottee. However, such general commonly usable areas and facilities earmarked for common use of all the allottees shall not include the exclusive reserved parking spaces. The Allottee acknowledges that these general Common Areas and Facilities have not been included in the computation of total area of the said Plot.</p>
                  </div>

                  <p className="m-0 leading-relaxed pt-1"><span className="font-bold">B. MANNER OF USE OF THE SAID LAND</span></p>
                  <p className="m-0 leading-relaxed">
                    That from the date of handing over of the possession of the said Land, the Allottee shall serve and perform the following covenants and conditions:
                  </p>
                  <div className="pl-3 space-y-1">
                    <p className="m-0"><span className="font-bold">I.</span> The Company or the maintenance agency so appointed by the Company and their agents shall be permitted at all reasonable hours, to enter the said Land for the purpose of inspection/maintenance; and</p>
                    <p className="m-0"><span className="font-bold">II.</span> Allottee shall use the said Land for legal purposes only and shall not carry on or permit to be carried on in the said Land or in any part thereof any activities which shall be or are likely to be unlawful, obnoxious or of nuisance, annoyance or disturbance to other occupants of the said Project or any part thereof or in any manner interfere in the use of the Common Areas and Facilities.</p>
                  </div>

                  <p className="m-0 leading-relaxed pt-1"><span className="font-bold">C. ALTERATIONS OF UNSOLD UNITS</span></p>
                  <p className="m-0 leading-relaxed">
                    The Company shall have the right to make, any alterations, additions, improvements whether structural or non-structural, interior or exterior, ordinary or extraordinary in relation to any unsold Land within the said Project and the Allottee shall have no right to raise objections or make any claims on this account.
                  </p>
                </div>

                {/* Clause 6 */}
                <div className="space-y-1">
                  <h4 className="font-black text-slate-900 text-[0.8rem] uppercase m-0 border-b border-slate-300 pb-0.5">6. ALTERATION IN PLANS, DESIGN AND SPECIFICATION AND RESULTANT CHANGES IN AMOUNTS PAYABLE</h4>
                  <p className="m-0 leading-relaxed">
                    The Allottee has seen and accepted the layout plans, designs and specifications in relation to the said Land in the said Project, which are tentative and subject to change/modification, and the Allottee hereby expressly authorizes the Company to effect suitable and necessary alterations/modifications/changes in the said layout plan, designs and specifications as the Company may deem fit or as is directed by competent authority(ies).
                  </p>
                </div>

                {/* Clause 7 */}
                <div className="space-y-1.5">
                  <h4 className="font-black text-slate-900 text-[0.8rem] uppercase m-0 border-b border-slate-300 pb-0.5">7. EVENTS OF DEFAULT AND ITS CONSEQUENCES</h4>
                  <p className="m-0 leading-relaxed pt-1"><span className="font-bold">A. EVENTS OF DEFAULTS</span></p>
                  <p className="m-0 leading-relaxed">
                    The Allottee agrees that all defaults, breaches and/or non-compliance of any of the terms and conditions of the Agreement shall be deemed to be events of defaults liable for consequences stipulated herein. Some of indicative events of defaults are mentioned below which are merely illustrative and are not exhaustive.
                  </p>
                  <div className="pl-3 space-y-1">
                    <p className="m-0"><span className="font-bold">I.</span> Failure to make payments within the time as stipulated in the schedule of payments as given in Annexure II of this Agreement and failure to pay the stamp duty, legal, registration, any incidental charges, any increases as demanded by the Company, any other charges, deposits, taxes etc. as may be notified by the Company to the Allottee under the terms of this Agreement, and all other defaults of similar nature.</p>
                    <p className="m-0"><span className="font-bold">II.</span> Failure to perform and observe any or all of the Allottee's obligations including those contained in this Agreement or if the Allottee fails to execute any other deed/document/undertakings/indemnities etc., or to perform any other obligation set forth in any other agreement with the Company in relation to the said Land.</p>
                    <p className="m-0"><span className="font-bold">III.</span> Failure to execute the conveyance deed within the time stipulated by the Company in its notice. Dishonor of any cheque(s) given by Allottee for any reason whatsoever.</p>
                    <p className="m-0"><span className="font-bold">IV.</span> Any other acts, deeds or things which the Allottee may commit, omit or fail to perform in terms of this Agreement, any other undertaking, affidavit/agreement/indemnity etc., or as demanded by the Company which in the opinion of the Company amounts to an event of default and the Allottee agrees and confirms that the decision of the Company in this regard shall be final and binding on the Allottee.</p>
                  </div>

                  <p className="m-0 leading-relaxed pt-1"><span className="font-bold">B. EARNEST MONEY AND ITS FORFEITURE & CANCELLATION</span></p>
                  <div className="pl-3 space-y-1">
                    <p className="m-0"><span className="font-bold">I.</span> The Parties hereby agree that the earnest money for the purpose of this Agreement shall be sum equivalent to 20% (Twenty Percent) of the amount received by the Company till the date of occurrence of event (hereinafter referred to as the "Earnest Money").</p>
                    <p className="m-0"><span className="font-bold">II.</span> The Allottee hereby authorizes the Company to cancel the allotment and forfeit the Earnest Money along with the interest @ 15% per annum on delayed payments, interest on installments, brokerage and the amount of any other fine or penalty paid by the Allottee hereunder, in the event of non-fulfillment or breach by the Allottee of any of the terms and conditions herein contained including specifically (but without limitation) upon the occurrence of an event of default as mentioned in Clause 7.1 above, as also in the event of failure by the Allottee to sign and return to the Company this Agreement within 30 days from the date of its dispatch by the Company. Further, the Allottee shall be left with no lien, right, title, interest or any claim of whatsoever nature in the said Land and/or any part of the said Project or against the Company or any of its directors, shareholders, employees or agents. However, the Company shall refund the amount paid by the Allottee upon cancellation of agreement without any deduction of whatsoever name called, provided the Allottee agrees to receive the amount due on cancellation after a period of 36 (thirty Six) months from the date of cancellation.</p>
                    <p className="m-0"><span className="font-bold">III.</span> Subject to Clause 7.2.2 above, the amount(s) if any, paid by the Allottee, over and above the Earnest Money, processing fee, interest on delayed payments, interest on installments, brokerage, amount of any fine or penalty etc., that stand forfeited, would be refunded to the Allottee by the Company without any interest or compensation whatsoever. The Company shall have the first lien and charge on the said Land(s) for all its dues payable by the Allottee to the Company. The Company shall thereafter be free to resell and/or deal with the said Land in any manner whatsoever at its sole discretion.</p>
                    <p className="m-0"><span className="font-bold">IV.</span> Without prejudice to the Company's aforesaid rights, the Company may at its sole discretion waive the breach by the Allottee in not making timely payments as per the payment plan but on the condition that the Allottee shall pay to the Company, interest on the delayed payments which shall be charged for the @ 15% per annum and for all period, or at any other rate of interest as the Company may deem fit.</p>
                  </div>
                </div>

                {/* Clause 8 */}
                <div className="space-y-1.5">
                  <h4 className="font-black text-slate-900 text-[0.8rem] uppercase m-0 border-b border-slate-300 pb-0.5">8. HANDING OVER THE POSSESSION OF THE LAND AND PARTIES' OBLIGATIONS IN RELATION THERETO</h4>
                  <p className="m-0 leading-relaxed pt-1"><span className="font-bold">A. EXPECTED TIME FOR HANDING OVER POSSESSION</span></p>
                  <p className="m-0 leading-relaxed">
                    Except where any delay is caused on account of reasons expressly provided for under this Agreement and other situations beyond the reasonable control of the Company and subject to the Company having obtained the license/certificate from the competent authority(ies), the Company shall endeavor to handover the possession of the said Land within a period of 1 years (One Year) from the date of execution of this Agreement or the date of receipt of all the clearances necessary for the completion of the Project, whichever is later, subject to timely payment by the Allottee of all the amounts payable under this Agreement and performance by the Allottee of all other obligations hereunder.
                  </p>

                  <p className="m-0 leading-relaxed pt-1"><span className="font-bold">B. EXECUTION OF SALE/CONVEYANCE DEED</span></p>
                  <div className="pl-3 space-y-1">
                    <p className="m-0"><span className="font-bold">I.</span> Any and all costs and expenses in relation to execution and registration of the sale/conveyance deed, e.g., stamp duty, registration fee, municipal duties (if any) and other incidental and legal expenses relating thereto shall be borne solely by the Allottee. As and when demanded by the Company, the Allottee shall pay the stamp duty, registration charges and all other incidental and legal expenses for execution and registration of sale/conveyance deed of the said Land in favour of the Allottee.</p>
                    <p className="m-0"><span className="font-bold">II.</span> Prior to taking over the possession of the said Land and execution of the sale/conveyance deed, the Allottee shall pay in full to the Company the Total Price and all other payments as may be due under the terms of this Agreement, any taxes/duties/levies as may be applicable and any interests/dues/penalties and holding charges (if any). In case the Allottee fails to deposit the stamp duty, registration charges and all other incidental and legal expenses etc., the Company shall be free to appropriate the part of sale price paid by the Allottee towards the said charges and expenses and the Allottee shall forthwith deposit the shortfall in the sale price so caused together with interest for the period of delay in depositing the sale price so appropriated according to payment plan at the rate and in the manner mentioned herein.</p>
                    <p className="m-0"><span className="font-bold">III.</span> The Allottee shall comply with all legal requirements for purchase of immovable property, wherever applicable, after execution of this Agreement and sign all applications, forms, affidavits, undertakings etc., as may be required for the said purpose. Further, subject to the terms and conditions mentioned herein, any other person to whom the Land is later sold, let, transferred, assigned or given possession of shall from time to time, sign all applications, papers, documents and do all acts, deeds and things as the Company may require for safeguarding the interest of the Company and/or of the said Project and/or of other allottee and occupants in the said Project and the Allottee shall be responsible to procure such compliance by such other person.</p>
                    <p className="m-0"><span className="font-bold">IV.</span> The Allottee undertakes to execute the sale/conveyance deed within 30 (thirty) days from the date of the Company issuing the notice offering possession of the said Land to the Allottee.</p>
                    <p className="m-0"><span className="font-bold">V.</span> If however, the Allottee fails to execute the sale/conveyance deed within time stipulated above in Clause 8.2.4, the Company shall be entitled to terminate the allotment of the said Land to the Allottee and in such event this Agreement shall stand cancelled. Upon such termination, the Allottee shall forfeit to the Company the entire amount of the Earnest Money as well as any processing fee, brokerage, interest on delayed payment, and the amount of any other fine or penalty paid by the Allottee, and the Allottee shall be left with no lien, right, title, interest or any claim of whatsoever nature in the said Land along with parking space(s) and/or any part of the said Project or against the Company or any of their directors, employees or agents. Company shall thereafter be free to resell the Land and/or deal with the said Land in any manner whatsoever at its sole discretion. The amount(s) if any, paid over and above the Earnest Money, processing fee, interest on delayed payments, interest on installments, brokerage, amount of any fine or penalty etc. that stand forfeited, would be refunded to the Allottee by the Company only after realizing such amounts to be refunded on resale of the said Land but without any interest or compensation whatsoever.</p>
                  </div>

                  <p className="m-0 leading-relaxed pt-1"><span className="font-bold">8. ALLOTTEE'S OBLIGATION TO TAKE POSSESSION AND CONSEQUENCES OF FAILURE TO TAKE POSSESSION</span></p>
                  <div className="pl-3 space-y-1">
                    <p className="m-0"><span className="font-bold">I.</span> Upon receiving a written intimation from the Company offering possession of the said Land, the Allottee shall within 30 (thirty) days, take possession of the said Land from the Company by executing necessary indemnities, undertakings and such other documentation as the Company may prescribe in this regard and by making all other charges/dues as specified in this Agreement or as otherwise agreed and the Company shall after satisfactory execution of such documents and payment of all such amounts give possession of the said Land to the Allottee, provided the Allottee is not in breach of any other term of this Agreement.</p>
                    <p className="m-0"><span className="font-bold">II.</span> Further the Allottee agrees that in the event of the Allottee's failure to take possession of the said Land within the time stipulated by the Company as per this Clause 8.4, the Allottee shall have no right or claim in respect of any item of work in the said Land which the Allottee may allege not to have been carried out or completed or in respect of any design specifications, or on account of any other reason whatsoever and the Allottee shall be deemed to have been fully satisfied in all respects concerning layout plan and all other work relating to the said Land/said Project.</p>
                  </div>
                </div>

                {/* Clause 9 */}
                <div className="space-y-1.5">
                  <h4 className="font-black text-slate-900 text-[0.8rem] uppercase m-0 border-b border-slate-300 pb-0.5">9. DELAY IN HANDOVER AND FORCE MAJEURE</h4>
                  <p className="m-0 leading-relaxed pt-1"><span className="font-bold">A. FORCE MAJEURE</span></p>
                  <p className="m-0 leading-relaxed">
                    That the Allottee agrees that the handing over the possession and the sale of the said Land to the Allottee is subject to force majeure clause which inter alia include delay on account of non-availability of licenses or due to a dispute or on account of civil commotion or by reason of war or enemy action or terrorist action or any natural calamity including earthquake, floods or any act of God, or as a result of any notice, order, rule or notification of the Government and/or any court of law or other public or competent authority and/or on account of the government or any competent authority withholding or delaying the grant of any approvals/permissions/certificates or for any other reason beyond the reasonable control of the Company, and in any of the aforesaid events the Company shall be entitled to a reasonable extension of time for delivery of possession and/or consummating the sale of the said Land to the Allottee.
                  </p>

                  <p className="m-0 leading-relaxed pt-1"><span className="font-bold">B. SUSPENSION AS A RESULT OF FORCE MAJEURE</span></p>
                  <p className="m-0 leading-relaxed">
                    Notwithstanding anything else contained in this Agreement, the Company as a result of the aforesaid contingencies arising, reserves the right to alter or vary the terms and conditions of allotment or if the circumstances beyond the control of the Company so warrant, the Company may suspend the project for such period as it may consider expedient and no compensation of any nature whatsoever can be claimed by the Allottee for the period of suspension of construction or for the resultant delay in handing over the possession of the said Land.
                  </p>

                  <p className="m-0 leading-relaxed pt-1"><span className="font-bold">C. ABANDONMENT OF THE PROJECT</span></p>
                  <p className="m-0 leading-relaxed">
                    The Allottee agrees that, if as a result of any legislation, order or rule or regulation made or issued by the Government or any other authority or if any competent authority refuses, delays, withholds, denies the grant of necessary approvals for the said Project or if any matters, issues relating to such approvals, permissions, notices, notifications by any competent authority becomes subject matter of any suit/writ before a competent court or if due to force majeure conditions, the Company, after provisional and/or final allotment is unable to deliver the said Land to the Allottee for his/her/its occupation and/or use, the Company shall be entitled, in its sole discretion, to abandon the whole or part of the said project (i.e., the development of the said Project) and upon such abandonment where the possession of the said Land is not handed over to the Allottee, then the Company shall be liable to (and its liability shall be limited to) refund to the Allottee the entire amount paid by the Allottee to the Company as on the date of such refund with simple interest @10.40% P.A., provided that it is agreed to by the Allottee that upon such refund the Allottee shall have no further claims against the Company and/or against any of its respective directors, employees or agents nor shall the Allottee have any right, title, claim or interest in or in relation to the said Project Land and/or the said Project or any part thereof.
                  </p>
                </div>

                {/* Clause 10 */}
                <div className="space-y-1.5">
                  <h4 className="font-black text-slate-900 text-[0.8rem] uppercase m-0 border-b border-slate-300 pb-0.5">10. TRANSFER/ASSIGNMENT OF ALLOTMENT</h4>
                  <p className="m-0 leading-relaxed pt-1"><span className="font-bold">A. TERMS AND CONDITIONS BINDING ON TRANSFEREE/ASSIGNEE</span></p>
                  <p className="m-0 leading-relaxed">
                    If the provisions of this Agreement, or any applicable laws, rules, regulations or bye-laws made pursuant thereto or otherwise applicable, do allow for the transfer of the Land, it is clearly understood and agreed by the Allottee that all the provisions contained herein and the obligations arising hereunder in respect of the said Land(s) and/or the said Project or otherwise owed to the Company shall equally be applicable to and enforceable against any and all occupiers, tenants, licensees and/or subsequent purchasers/assignees/nominees/allottee of the said Land(s) as the said obligations go along with the said Land(s) for all intents and purposes. In the event of subsequent sale or transfer or assignment of the allotment by the Allottee, the Allottee and the subsequent transferee/assignee shall subscribe to the Endorsement Schedule as provided in this Agreement.
                  </p>

                  <p className="m-0 leading-relaxed pt-1"><span className="font-bold">B. JOINT AND SEVERAL LIABILITY OF CO-ALLOTTEES</span></p>
                  <p className="m-0 leading-relaxed">
                    In the event the allotment of the said Land has been done in favour of more than one person (both of which have been collectively referred to herein as the "Allottee"), then each such allottee shall be jointly and severally liable for all of the Allottee's obligations hereunder.
                  </p>
                </div>

                {/* Clause 11 */}
                <div className="space-y-1">
                  <h4 className="font-black text-slate-900 text-[0.8rem] uppercase m-0 border-b border-slate-300 pb-0.5">11. INDEMNIFICATION OBLIGATION OF THE ALLOTTEE</h4>
                  <p className="m-0 leading-relaxed">
                    The Allottee hereby covenants with the Company to pay from time to time and at all times, the amounts which the Allottee is liable to pay as agreed hereunder and to observe and perform all the covenants and conditions of this Agreement and to keep the Company and its directors, employees, agents and representatives, estate and effects, indemnified and harmless against any loss, damages, costs and expenses suffered by any of them on account of the failure of the Allottee to make the said payments or his/her/its failure to perform all his/her/its obligations under the terms of this Agreement. This is in addition to any other remedy available to any of the aforementioned indemnified persons under the terms of this Agreement or otherwise available in law.
                  </p>
                </div>

                {/* Clause 12 */}
                <div className="space-y-1">
                  <h4 className="font-black text-slate-900 text-[0.8rem] uppercase m-0 border-b border-slate-300 pb-0.5">12. RIGHT OF THE COMPANY TO TRANSFER THE OWNERSHIP OF THE PROJECT</h4>
                  <p className="m-0 leading-relaxed">
                    The Company reserves the right to transfer the ownership of the said Project in whole or in parts, and at any time during the term of this Agreement or thereafter, to any other person (whether incorporated or not) including to a partnership firm, body corporate(s), association of persons etc., by way of transfer/sale/assignment or any other arrangement, as may be decided by the Company in its sole discretion, and the Allottee agrees that he/she/it has no objection to this and shall not raise any objection in this regard. To this end, the Company is entitled to assign this Agreement in favour of any such transferee and further the Allottee agrees, if so required by the Company or the proposed transferee to enter into a fresh agreement with the said transferee on same terms and conditions as contained herein.
                  </p>
                </div>

                {/* Clause 13 */}
                <div className="space-y-1">
                  <h4 className="font-black text-slate-900 text-[0.8rem] uppercase m-0 border-b border-slate-300 pb-0.5">13. ALLOTTEE'S OBLIGATION TO ABIDE BY APPLICABLE LAW</h4>
                  <p className="m-0 leading-relaxed">
                    That the Allottee shall abide by the laws of the land, any local enactments in respect of this Agreement and the said Land/said Project. The Company may, with the prior notice in writing to the Allottee, inspect the said Land from time to time at frequencies considered necessary by the Company and should there be any contravention, the Allottee will ensure compliance with the requirements as per the applicable laws. Any penalties levied by the Government, municipal body or any authority etc., as a result of non-compliance of any law by the Allottee (or person claiming through or under the Allottee) in respect of the said Land will be borne by the Allottee alone. The Allottee shall keep the Company and its directors, employees and agents harmless and indemnified against all such claims or penalties.
                  </p>
                </div>

                {/* Clause 14 */}
                <div className="space-y-1.5">
                  <h4 className="font-black text-slate-900 text-[0.8rem] uppercase m-0 border-b border-slate-300 pb-0.5">14. NOTICE</h4>
                  <p className="m-0 leading-relaxed">
                    <span className="font-bold">A.</span> That any notice, letter or communication to be made, served or communicated unto the Company under these presents must be in writing and shall be deemed to be duly made, served or communicated only, if the notice or letter or communication is addressed to the Company at the address mentioned hereinabove or any changed address as may be intimated by the Company in this behalf and sent by registered post. Similarly, any notice, letter or communication to the Allottee shall be deemed to be made, served or communicated only, if the same are addressed to the address of the Allottee as mentioned above, and thereafter, when the residence of the Allottee is shifted to the said Land at the said address.
                  </p>
                  <p className="m-0 leading-relaxed">
                    <span className="font-bold">B.</span> That the Allottee shall inform the Company in writing of any change in the mailing address mentioned in this Agreement failing which all demands, notices, etc., by the Company shall be mailed to the address given in this Agreement and deemed to have been received by the Allottee. In case of joint Allottees, all communication shall be sent to the first named Allottee in this Agreement and that shall constitute sufficient notice to all the co-allottees. All communication/notice to the Company shall be in writing and shall be sent to the Company at the following address of its Corporate Office:<br />
                    <span className="font-bold">Raj Bhawan, ManglaSthan, Ramchandrapur, Near Bus Stand, Bihar Shariff, Bihar - 803101.</span>
                  </p>
                </div>

                {/* Clause 15 */}
                <div className="space-y-1">
                  <h4 className="font-black text-slate-900 text-[0.8rem] uppercase m-0 border-b border-slate-300 pb-0.5">15. ENTIRE AGREEMENT</h4>
                  <p className="m-0 leading-relaxed">
                    That this Agreement which has been titled as "BUYER'S Agreement" constitutes the entire Agreement between the Parties and revokes and supersedes all previous discussions/correspondence and agreement between the Parties, if any, concerning the matters covered herein whether written, oral or implied. This Agreement shall not be changed or modified except by written amendments duly agreed by the Parties. The terms and conditions and various provisions embodied in this Agreement shall be appropriately incorporated in the sale/conveyance deed and shall form part thereof.
                  </p>
                </div>

                {/* Clause 16 */}
                <div className="space-y-1">
                  <h4 className="font-black text-slate-900 text-[0.8rem] uppercase m-0 border-b border-slate-300 pb-0.5">16. RIGHT TO AMEND ANNEXURES</h4>
                  <p className="m-0 leading-relaxed">
                    Company further reserves the right to correct, modify, amend or change all the annexures attached to Agreement and also annexures which are indicated to be tentative at any time prior to the execution of conveyance deed of the said Land.
                  </p>
                </div>

                {/* Clause 17 */}
                <div className="space-y-1">
                  <h4 className="font-black text-slate-900 text-[0.8rem] uppercase m-0 border-b border-slate-300 pb-0.5">17. DISPUTE RESOLUTION</h4>
                  <p className="m-0 leading-relaxed">
                    All or any disputes arising out of or touching upon or in relation to the terms of this Agreement including the interpretation and validity of the terms hereof and the respective rights and obligations of the Parties shall be settled amicably by mutual discussion failing which the same shall be settled through arbitration. The arbitration proceedings shall be governed by the Arbitration and Conciliation Act, 1996 or any statutory amendments/modifications thereof for the time being in force. The arbitration proceedings shall be held at an appropriate location in Bihar by a sole arbitrator who shall be appointed by the Company and whose decision shall be final and binding upon the Parties.
                  </p>
                </div>

                {/* Clause 18 */}
                <div className="space-y-1">
                  <h4 className="font-black text-slate-900 text-[0.8rem] uppercase m-0 border-b border-slate-300 pb-0.5">18. GOVERNING LAW & JURISDICTION</h4>
                  <p className="m-0 leading-relaxed">
                    This Agreement and all rights and obligations of the Parties under or arising out of this Agreement shall be construed and enforced in accordance with the laws of India. The Courts at Bihar Shariff, Nalanda, Bihar, alone shall have the jurisdiction.
                  </p>
                </div>

                {/* Final Witness & Signature Block */}
                <div className="pt-4 space-y-4">
                  <p className="italic text-[0.76rem] font-medium text-slate-800 text-center m-0">
                    IN WITNESS WHEREOF, the Parties hereto have set their hands and seal to these presents on the day, month and year first above written.
                  </p>

                  <div className="border border-slate-300 rounded-lg p-4 bg-slate-50/50 space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="font-extrabold uppercase text-[0.78rem] text-slate-900 m-0">SIGNED & DELIVERED</p>
                        <p className="font-bold text-[0.74rem] text-slate-700 m-0 mb-3">For & on behalf of {companyName}:</p>
                        <div className="h-10"></div>
                        <p className="font-bold text-[0.74rem] text-slate-900 m-0">(Authorized Signatory)</p>
                      </div>

                      <div>
                        <p className="font-extrabold uppercase text-[0.78rem] text-slate-900 m-0">SIGNED & DELIVERED</p>
                        <p className="font-bold text-[0.74rem] text-slate-700 m-0 mb-3">For & on behalf of the Allottee:</p>
                        <p className="m-0 font-bold text-[0.74rem]">1. ___________________________ (Sign 1st Applicant)</p>
                        <p className="m-0 text-[0.72rem] text-slate-600 pl-4 mb-2">Name: <span className="font-bold uppercase text-slate-900">{customerName}</span></p>
                        <p className="m-0 font-bold text-[0.74rem]">2. ___________________________ * (Sign Co. Applicant)</p>
                        <p className="m-0 text-[0.68rem] text-slate-500 italic pl-4">*Applicable in the event of co-allottees</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-300 pt-3">
                      <p className="font-bold uppercase text-[0.76rem] text-slate-900 m-0 mb-2">WITNESSES:</p>
                      <div className="grid grid-cols-2 gap-4 text-[0.74rem]">
                        <p className="m-0">1. ___________________________ Name: _______________</p>
                        <p className="m-0">2. ___________________________ Name: _______________</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Annexure I */}
                <div className="pt-6 space-y-3">
                  <h3 className="font-black text-center text-sm uppercase tracking-wider text-slate-900 border-t-2 border-b-2 border-slate-900 py-1 m-0">
                    ANNEXURE - 1
                  </h3>

                  <div className="border border-slate-400 rounded overflow-hidden">
                    <table className="w-full text-left text-[0.76rem] border-collapse">
                      <tbody>
                        <tr className="border-b border-slate-300">
                          <td className="p-2 font-bold bg-slate-100/70 w-1/4 border-r border-slate-300">PROJECT LOCALITY:</td>
                          <td className="p-2 w-1/4 border-r border-slate-300 uppercase font-bold">{cityRajgir}</td>
                          <td className="p-2 font-bold bg-slate-100/70 w-1/4 border-r border-slate-300">PLAN:</td>
                          <td className="p-2 w-1/4 font-mono font-bold uppercase">{planCode}</td>
                        </tr>
                        <tr className="border-b border-slate-300">
                          <td className="p-2 font-bold bg-slate-100/70 border-r border-slate-300">PLOT SIZE (SQFT):</td>
                          <td className="p-2 border-r border-slate-300 font-bold">{plotArea}</td>
                          <td className="p-2 font-bold bg-slate-100/70 border-r border-slate-300">PLOT VALUE:</td>
                          <td className="p-2 font-bold text-slate-900">{formatCurrency(netPlotValue)}</td>
                        </tr>
                        <tr className="border-b border-slate-300">
                          <td className="p-2 font-bold bg-slate-100/70 border-r border-slate-300">PLOT PAYMENT PLAN:</td>
                          <td className="p-2 border-r border-slate-300 font-bold uppercase">{booking.scheme || 'INSTALLMENT'}</td>
                          <td className="p-2 font-bold bg-slate-100/70 border-r border-slate-300">TOTAL PAYMENT RECEIVED:</td>
                          <td className="p-2 font-bold text-emerald-700">{formatCurrency(downpaymentAmount)}</td>
                        </tr>
                        <tr className="border-b border-slate-300">
                          <td className="p-2 font-bold bg-slate-100/70 border-r border-slate-300">REST AMOUNT:</td>
                          <td className="p-2 border-r border-slate-300 font-bold text-slate-900">{formatCurrency(remainingBalanceAmount)}</td>
                          <td className="p-2 font-bold bg-slate-100/70 border-r border-slate-300">EMI DURATION:</td>
                          <td className="p-2 font-bold">{installmentCount} installments</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold bg-slate-100/70 border-r border-slate-300">EMI AMOUNT:</td>
                          <td className="p-2 border-r border-slate-300 font-bold">{formatCurrency(standardEmiAmt)}</td>
                          <td className="p-2 font-bold bg-slate-100/70 border-r border-slate-300">PAYMENT MODE / DETAILS:</td>
                          <td className="p-2 font-bold uppercase">{booking.paymentMode || 'WIRE TRANSFER / CHEQUE / DD'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default PlotAgreementEnglish;
