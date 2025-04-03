import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import numberToWords from 'number-to-words';


const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 10,
  },
  tableContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    // marginTop: 10,
  },
  table: {
    width: '65%',
    borderRightWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 2,

    borderStyle: 'solid',
    borderColor: '#000',
  },
  tableRight: {
    width: '35%',
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderStyle: 'solid',
    borderColor: '#000',
  },
  row: {
    flexDirection: 'row',
    // borderBottomWidth: 1,
    borderStyle: 'solid',
    borderColor: '#000',
    padding: 5,
  },
  cell: {
    width: '25%',
    textAlign: 'center',
    marginTop:'-10px',
    padding: 3,

  },
  cellHeader: {
    fontWeight: 'bold',
    color: '#007bff',
    marginTop:'-4px'


  },
  deductionsCell: {
    width: '50%',
    fontWeight: 'bold',

  },
  deductionsAmount: {
    width: '50%',
    textAlign: 'right',
    fontWeight: 'bold',

  },
  totalRow: {
    fontWeight: 'bold',
    flexDirection: 'row',
    padding: 5,
    borderTopWidth: 1,
    borderStyle: 'solid',
    borderColor: '#000',
    
  },
  title: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  downloadButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#007bff',
    color: 'white',
    textAlign: 'center',
    borderRadius: 5,
    fontSize: 14,
    cursor: 'pointer',
  },
  tableCell: {
    marginTop: '5px',
    alignItems: 'center',
    borderRightWidth: 2,
    borderLeftWidth: 2,
    borderTopWidth:2,
        borderBottomWidth: 1,

    borderStyle: 'solid',
    borderColor: '#000',
},
row1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // marginTop: '10px',
    borderRightWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 1,

    // borderTopWidth:1,
    borderStyle: 'solid',
    borderColor: '#000',
},
column: {
    width: '48%',
    fontSize: 10,
    lineHeight: 1.5,
},
fieldWrapper: {
    flexDirection: 'row',
    marginBottom: 4, // Add space between each field
        marginTop: '5px',

},
fieldLabel: {
    fontWeight: 'bold',
    width: '50%', // Allocating 45% width for labels
    marginLeft:'5'
},
fieldValue: {
    width: '50%', // Allocating 55% width for values and aligning them in a straight line
    textAlign: 'left', // Ensure values are left aligned
    marginLeft:'5'

},
hr: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginTop: 8,
},
}

);
const convertToIndianWords = (number) => {
  if (number === 0) return "Zero Rupees Only";

  const units = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];
  
  const scales = [
    '', 'Thousand', 'Lakh', 'Crore'
  ];
  
  const getWords = (num) => {
    if (num < 20) return units[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + units[num % 10] : '');
    if (num < 1000) return units[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' and ' + getWords(num % 100) : '');
    
    let scaleIndex = 0;
    let words = '';
    
    while (num > 0) {
      const part = num % 100; // last two digits
      if (part) {
        words = getWords(part) + ' ' + scales[scaleIndex] + ' ' + words;
      }
      num = Math.floor(num / 100); // remove last two digits
      scaleIndex++;
    }
    
    return words.trim();
  };

  return getWords(number) + ' Rupees Only';
};

// Create Document Component
const MyDocument = ({ selectedEmployeeId, fullName, basicsalary, epf, professionalTax, travellingAllowance, totalEarnings, totalDeductions, netSalary, lopDays, lopAmount }) => {
  const netSalaryInWords = convertToIndianWords(netSalary);
  return(
 <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.tableCell}>
                <Text style={{ fontWeight: 'bold', fontSize: '12px', marginTop: '5px'
 }}>
                    Varnaaz Technologies Pvt Ltd
                </Text>
                <Text style={{ fontWeight: 'bold', fontSize: '13px' }}>#52, 9th Main Road, Banashankari Stage II,</Text>
                <Text style={{ fontWeight: 'bold', fontSize: '13px' }}>Banashankari, Bengaluru, Karnataka 560070</Text>
                <Text
                    style={{
                        fontWeight: 'bold',
                        fontSize: 10,
                        marginTop: 8,
                        marginBottom: 3,
                    }}
                >
                    Pay slip from 01/08/2024 to 31/08/2024
                </Text>
            </View>

            {/* <View style={styles.hr} /> */}

            {/* row1 with two columns */}
            <View style={styles.row1}>
                {/* First column */}
                <View style={styles.column}>
                    <View style={styles.fieldWrapper}>
                        <Text style={styles.fieldLabel}>Employee Code:</Text>
                        <Text style={styles.fieldValue}>{selectedEmployeeId}</Text>
                    </View>
                    <View style={styles.fieldWrapper}>
                        <Text style={styles.fieldLabel}>Date of Joining:</Text>
                        <Text style={styles.fieldValue}>01/01/2020</Text>
                    </View>
                    <View style={styles.fieldWrapper}>
                        <Text style={styles.fieldLabel}>Department:</Text>
                        <Text style={styles.fieldValue}>IT</Text>
                    </View>
                    <View style={styles.fieldWrapper}>
                        <Text style={styles.fieldLabel}>Designation:</Text>
                        <Text style={styles.fieldValue}>Senior Developer</Text>
                    </View>
                    <View style={styles.fieldWrapper}>
                        <Text style={styles.fieldLabel}>Region:</Text>
                        <Text style={styles.fieldValue}>South</Text>
                    </View>
                    <View style={styles.fieldWrapper}>
                        <Text style={styles.fieldLabel}>Location:</Text>
                        <Text style={styles.fieldValue}>Bengaluru</Text>
                    </View>
                    <View style={styles.fieldWrapper}>
                        <Text style={styles.fieldLabel}>Days Worked:</Text>
                        <Text style={styles.fieldValue}>22</Text>
                    </View>
                    <View style={styles.fieldWrapper}>
                        <Text style={styles.fieldLabel}>LOP:</Text>
                        <Text style={styles.fieldValue}>{lopDays}</Text>
                    </View>
                    <View style={styles.fieldWrapper}>
                        <Text style={styles.fieldLabel}>Tax Regime:</Text>
                        <Text style={styles.fieldValue}>Old</Text>
                    </View>
                </View>

                {/* Second column */}
                <View style={styles.column}>
                    <View style={styles.fieldWrapper}>
                        <Text style={styles.fieldLabel}>Employee Name:</Text>
                        <Text style={styles.fieldValue}>{fullName}</Text>
                    </View>
                    <View style={styles.fieldWrapper}>
                        <Text style={styles.fieldLabel}>Bank Name:</Text>
                        <Text style={styles.fieldValue}>ABC Bank</Text>
                    </View>
                    <View style={styles.fieldWrapper}>
                        <Text style={styles.fieldLabel}>Bank Account Number:</Text>
                        <Text style={styles.fieldValue}>1234567890</Text>
                    </View>
                    <View style={styles.fieldWrapper}>
                        <Text style={styles.fieldLabel}>Permanent Account Number:</Text>
                        <Text style={styles.fieldValue}>ABCD1234E</Text>
                    </View>
                    <View style={styles.fieldWrapper}>
                        <Text style={styles.fieldLabel}>PF Account Number:</Text>
                        <Text style={styles.fieldValue}>PF123456789</Text>
                    </View>
                    <View style={styles.fieldWrapper}>
                        <Text style={styles.fieldLabel}>Esic Account Number:</Text>
                        <Text style={styles.fieldValue}>ESIC987654321</Text>
                    </View>
                    <View style={styles.fieldWrapper}>
                        <Text style={styles.fieldLabel}>UAN Number:</Text>
                        <Text style={styles.fieldValue}>UAN123456789</Text>
                    </View>
                    <View style={styles.fieldWrapper}>
                        <Text style={styles.fieldLabel}>Arrears Days:</Text>
                        <Text style={styles.fieldValue}>1</Text>
                    </View>
                </View>
            </View>
            {/* <View style={styles.hr} /> */}
            <View style={styles.tableContainer}>
        {/* Earnings Table */}
        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={[styles.cell, styles.cellHeader,    { textAlign: 'left'}]}>Earnings</Text>
            <Text style={[styles.cell, styles.cellHeader, {  borderRightWidth: 1, textAlign: 'right' }]}>Monthly Rate</Text>
            <Text style={[styles.cell, styles.cellHeader,    { textAlign: 'right', borderRightWidth: 1, borderColor: 'black'}]}>Current Month</Text>
            <Text style={[styles.cell, styles.cellHeader,    { textAlign: 'right', borderRightWidth: 1, borderColor: 'black'}]}>Arrears</Text>
            <Text style={[styles.cell, styles.cellHeader,    { textAlign: 'right'}]}>Total</Text>
          </View>
          {/* Row 1 */}
          <View style={styles.row}>
            <Text style={[styles.cell ,    { textAlign: 'left'}]}>Basic + Dearness Allowance (DA)</Text>
            <Text style={[styles.cell,    { textAlign: 'right', borderRightWidth: 1, borderColor: 'black'}]}>{basicsalary}.00</Text>
            <Text style={[styles.cell,    { textAlign: 'right', borderRightWidth: 1, borderColor: 'black'}]}>{basicsalary}.00</Text>
            <Text style={[styles.cell,    { textAlign: 'right', borderRightWidth: 1, borderColor: 'black'}]}>0.00</Text>
            <Text style={[styles.cell,    { textAlign: 'right'}]}>{basicsalary}</Text>
          </View>
          {/* Row 2 */}
          <View style={styles.row}>
            <Text style={[styles.cell,    { textAlign: 'left'}]}>Travelling Allowance</Text>
            <Text style={[styles.cell,    { textAlign: 'right', borderRightWidth: 1, borderColor: 'black'}]}>{travellingAllowance}.00</Text>
            <Text style={[styles.cell,    { textAlign: 'right', borderRightWidth: 1, borderColor: 'black'}]}>{travellingAllowance}.00</Text>
            <Text style={[styles.cell,    { textAlign: 'right', borderRightWidth: 1, borderColor: 'black'}]}>0.00</Text>
            <Text style={[styles.cell,    { textAlign: 'right'}]}>{travellingAllowance}.00</Text>
          </View>
          {/* Row 3 */}
          <View style={styles.row}>
            <Text style={[styles.cell,    { textAlign: 'left'}]}>Statutory Bonus</Text>
            <Text style={[styles.cell,    { textAlign: 'right', borderRightWidth: 1, borderColor: 'black'}]}>0.00</Text>
            <Text style={[styles.cell,    { textAlign: 'right', borderRightWidth: 1, borderColor: 'black'}]}>0.00</Text>
            <Text style={[styles.cell,    { textAlign: 'right', borderRightWidth: 1, borderColor: 'black'}]}>0.00</Text>
            <Text style={[styles.cell,    { textAlign: 'right'}]}>0.00</Text>
          </View>
          {/* Row 4 */}
          <View style={styles.row}>
            <Text style={[styles.cell,    { textAlign: 'left'}]}>Incentive</Text>
            <Text style={[styles.cell,    { textAlign: 'right', borderRightWidth: 1, borderColor: 'black'}]}>0.00</Text>
            <Text style={[styles.cell,    { textAlign: 'right', borderRightWidth: 1, borderColor: 'black'}]}>0.00</Text>
            <Text style={[styles.cell,    { textAlign: 'right', borderRightWidth: 1, borderColor: 'black'}]}>0.00</Text>
            <Text style={[styles.cell,    { textAlign: 'right'}]}>0.00</Text>
          </View>
          {/* Row 5 */}
          <View style={styles.row}>
            <Text style={[styles.cell,    { textAlign: 'left'}]}>Life Insurance Contribution</Text>
            <Text style={[styles.cell,    { textAlign: 'right', borderRightWidth: 1, borderColor: 'black'}]}>0.00</Text>
            <Text style={[styles.cell,    { textAlign: 'right', borderRightWidth: 1, borderColor: 'black'}]}>0.00</Text>
            <Text style={[styles.cell,    { textAlign: 'right', borderRightWidth: 1, borderColor: 'black'}]}>0.00</Text>
            <Text style={[styles.cell,    { textAlign: 'right'}]}>0.00</Text>
          </View>
          {/* Row 6 */}
          <View style={styles.row}>
            <Text style={[styles.cell,    { textAlign: 'left', marginBottom:'-4px'}]}>BONUS</Text>
            <Text style={[styles.cell,    { textAlign: 'right', marginBottom:'-4px', borderRightWidth: 1, borderColor: 'black'}]}>0.00</Text>
            <Text style={[styles.cell,    { textAlign: 'right',  marginBottom:'-4px', borderRightWidth: 1, borderColor: 'black'}]}>0.00</Text>
            <Text style={[styles.cell,    { textAlign: 'right',  marginBottom:'-4px', borderRightWidth: 1, borderColor: 'black'}]}>0.00</Text>
            <Text style={[styles.cell,    { textAlign: 'right'}]}>0.00</Text>
          </View>
          {/* Total Row */}
          <View style={[styles.totalRow, {display:'flex', justifyContent:'space-between' }]}>
            <Text style={[ { fontWeight:'bold', fontSize:'12px'}]}>Total Earnings</Text>
            <Text style={[{ textAlign:'right', fontSize:'12px' }]}>{totalEarnings}.00</Text>
          </View>
          <View style={styles.totalRow}>
          <Text style={{fontWeight:'bold', fontSize:'12px'}}>In words :{netSalaryInWords}</Text>

          </View>

        </View>

        {/* Deductions Table */}
        <View style={styles.tableRight}>
          <View style={styles.row}>
            <Text style={[styles.deductionsCell, styles.cellHeader]}>Deductions</Text>
            <Text style={[styles.deductionsAmount, styles.cellHeader]}>Amount</Text>
          </View>
          {/* Row 1 */}
          <View style={styles.row}>
            <Text style={styles.deductionsCell}>EPF</Text>
            <Text style={styles.deductionsAmount}>{epf}.00</Text>
          </View>
          {/* Row 2 */}
          <View style={styles.row}>
            <Text style={styles.deductionsCell}>ESIC</Text>
            <Text style={styles.deductionsAmount}>0.00</Text>
          </View>
          {/* Row 3 */}
          <View style={styles.row}>
            <Text style={styles.deductionsCell}>Other Deduction</Text>
            <Text style={styles.deductionsAmount}>0.00</Text>
          </View>
          {/* Row 4 */}
          <View style={styles.row}>
            <Text style={styles.deductionsCell}>We Care</Text>
            <Text style={styles.deductionsAmount}>0.00</Text>
          </View>
          {/* Row 5 */}
          <View style={styles.row}>
            <Text style={styles.deductionsCell}>Professional Tax</Text>
            <Text style={styles.deductionsAmount}>{professionalTax}.00</Text>
          </View>
          {/* Row 6 */}
          <View style={[styles.row, ]}>
            <Text style={styles.deductionsCell}>Life Insurance Company</Text>
            <Text style={styles.deductionsAmount}>0.00</Text>
          </View>
          <View style={[styles.row, {marginBottom:'15px'}]}>
            <Text style={styles.deductionsCell}>LOP</Text>
            <Text style={styles.deductionsAmount}>{lopAmount}</Text>
          </View>
          {/* Total Row */}
          <View style={[styles.totalRow,{fontWeight:'bold', fontSize:'12px'}]}>
            <Text style={styles.deductionsCell}>Total Deductions</Text>
            <Text style={styles.deductionsAmount}>{totalDeductions}.00</Text>
          </View>
          <View style={[styles.totalRow,{fontWeight:'bold', fontSize:'12px'}]}>
          <Text style={styles.deductionsCell}>Net Salary:</Text>
          <Text style={styles.deductionsAmount}>{netSalary}.00</Text>
          </View>
        </View>
      </View>

     
    </Page>
  </Document>
  );
};

export default MyDocument;