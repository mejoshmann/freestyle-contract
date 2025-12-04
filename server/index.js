const express = require("express");
const cors = require("cors");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors({
  origin: ["http://localhost:5173", "https://your-netlify-app.netlify.app"],
  credentials: true
}));
app.use(express.json());

const CONTRACT_TEMPLATE = `
[CENTER]INDEPENDENT CONTRACTOR AGREEMENT[/CENTER]

[CENTER]This Independent Contractor Agreement (the "Agreement") is made as of the 4th day of[/CENTER]
[CENTER]January, 2026 (the "Effective Date").[/CENTER]

[CENTER]BETWEEN:[/CENTER]

[CENTER]FREESTYLE VANCOUVER SKI CLUB[/CENTER]
[CENTER]("Company")[/CENTER]

[CENTER]AND:[/CENTER]

[CENTER][Contractor Name][/CENTER]
[CENTER][Contractor Email][/CENTER]
[CENTER]("Contractor")[/CENTER]

WHEREAS the Company wishes to retain the services of the Contractor to provide coaching
and administrative services, and the Contractor has agreed to provide such services to the
Company on the terms and conditions set out in this Agreement.

NOW THEREFORE in consideration of the mutual covenants and agreements contained in this
Agreement, the parties agree as follows:

1. SERVICES
The Contractor shall provide coaching and administrative services as requested by the
Company (the "Services").

2. HOURS, FEES & EXPENSES
The Company will pay the Contractor as payment for the Services a fee of, excluding GST:
(a) $[Pay Rate] CAD per day;
(b) $[half pay rate] CAD per half day/evening;
(c) $22 CAD per hour for admin (must be pre-authorized);

3. INDEPENDENT CONTRACTOR
The Contractor is an independent contractor and not an employee of the Company. The
Contractor is responsible for all taxes, insurance, and other obligations.

4. TERM AND TERMINATION
This Agreement shall commence on the Effective Date and continue until terminated by
either party with 14 days written notice.

5. CONFIDENTIALITY
The Contractor agrees to keep confidential all information received from the Company.

6. GENERAL
This Agreement constitutes the entire agreement between the parties and may only be
amended in writing signed by both parties.

[CENTER]SIGNED BY:[/CENTER]

_________________________                    _________________________
Executive Director                          [Contractor Name]
Freestyle Vancouver Ski Club                Contractor
Date: _________________                      Date: _________________
`;

app.post("/api/generate-pdf", async (req, res) => {
  const { contractorName, email, payRate } = req.body;
  const halfDayPay = (payRate / 2).toFixed(2);

  const contractText = CONTRACT_TEMPLATE
    .replace(/\[Contractor Name\]/g, contractorName)
    .replace(/\[Contractor Email\]/g, email)
    .replace(/\[Pay Rate\]/g, payRate)
    .replace(/\[half pay rate\]/g, halfDayPay);

  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([600, 900]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const lineHeight = 14;
  const pageMargin = 50;

  // Embed logo at top left
  try {
    const logoPath = path.join(__dirname, "../public/logo.png");
    const logoImageBytes = fs.readFileSync(logoPath);
    const logoImage = await pdfDoc.embedPng(logoImageBytes);
    const logoDims = logoImage.scale(0.8); // Adjust scale as needed
    
    page.drawImage(logoImage, {
      x: pageMargin,
      y: page.getSize().height - pageMargin - logoDims.height,
      width: logoDims.width,
      height: logoDims.height,
    });
  } catch (err) {
    console.log("Logo not found or invalid format:", err.message);
  }

  let y = page.getSize().height - pageMargin - 80; // Start text below logo

  const drawLine = (line, align = 'left') => {
    const pageHeight = page.getSize().height;
    const pageWidth = page.getSize().width;
    if (y < pageMargin) {
      page = pdfDoc.addPage([600, 900]);
      y = pageHeight - pageMargin;
    }
    
    let xPosition = pageMargin;
    if (align === 'center') {
      const textWidth = font.widthOfTextAtSize(line, 12);
      xPosition = (pageWidth - textWidth) / 2;
    }
    
    page.drawText(line, { x: xPosition, y, size: 12, font, color: rgb(0, 0, 0) });
    y -= lineHeight;
  };

  // Split each paragraph into multiple lines if too long
  let signatureY = null; // Track Y position for signature fields
  
  contractText.split("\n").forEach((line) => {
    // Check for center alignment tags
    let align = 'left';
    let processedLine = line;
    
    if (line.includes('[CENTER]') && line.includes('[/CENTER]')) {
      align = 'center';
      processedLine = line.replace('[CENTER]', '').replace('[/CENTER]', '');
    }
    
    // Track position when we reach signature lines
    if (processedLine.includes('_________________________')) {
      signatureY = y;
    }
    
    if (processedLine.length > 80 && align === 'left') {
      // simple wrap at 80 chars (only for left-aligned text)
      let start = 0;
      while (start < processedLine.length) {
        drawLine(processedLine.substring(start, start + 80), align);
        start += 80;
      }
    } else {
      drawLine(processedLine, align);
    }
  });

  // Add signature annotation fields
  const form = pdfDoc.getForm();
  
  // Find the last page where signatures are
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];
  
  // Create signature fields (text fields for manual signing)
  const execSignatureField = form.createTextField('executiveSignature');
  execSignatureField.setText('');
  execSignatureField.addToPage(lastPage, {
    x: pageMargin,
    y: signatureY || 100,
    width: 200,
    height: 30,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 1,
  });
  
  const contractorSignatureField = form.createTextField('contractorSignature');
  contractorSignatureField.setText('');
  contractorSignatureField.addToPage(lastPage, {
    x: 320,
    y: signatureY || 100,
    width: 200,
    height: 30,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 1,
  });
  
  // Add date fields
  const execDateField = form.createTextField('executiveDate');
  execDateField.setText('');
  execDateField.addToPage(lastPage, {
    x: pageMargin + 50,
    y: (signatureY || 100) - 30,
    width: 100,
    height: 20,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 1,
  });
  
  const contractorDateField = form.createTextField('contractorDate');
  contractorDateField.setText('');
  contractorDateField.addToPage(lastPage, {
    x: 370,
    y: (signatureY || 100) - 30,
    width: 100,
    height: 20,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 1,
  });

  const pdfBytes = await pdfDoc.save();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=Contract_${contractorName}.pdf`);
  res.send(Buffer.from(pdfBytes));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
