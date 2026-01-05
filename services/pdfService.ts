
import { jsPDF } from "jspdf";
import { ColoringBookData } from "../types";

export const generateKDPPdf = async (book: ColoringBookData): Promise<Blob> => {
  // KDP Standard size: 8.5 x 11 inches
  // Using 'pt' for precise control. 1 inch = 72 points.
  const width = 8.5 * 72;
  const height = 11 * 72;
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: [width, height],
  });

  // KDP Paperback Print Ready Margins: 0.75 inch safety margin for non-bleed
  // This ensures no text or critical art is cut off during trimming.
  const margin = 0.75 * 72; 
  const contentWidth = width - (margin * 2);

  /**
   * Helper for centered wrapped text using high-quality book fonts.
   * Titles use 'Times' (Serif) for a professional look.
   * Body text uses 'Helvetica' (Sans-Serif) for readability.
   */
  const drawCenteredWrappedText = (text: string, fontSize: number, yStart: number, font: "times" | "helvetica" = "times", isBold: boolean = false) => {
    pdf.setFontSize(fontSize);
    pdf.setFont(font, isBold ? "bold" : "normal");
    const lines = pdf.splitTextToSize(text, contentWidth);
    lines.forEach((line: string, index: number) => {
      pdf.text(line, width / 2, yStart + (index * fontSize * 1.3), { align: "center" });
    });
    return lines.length * fontSize * 1.3;
  };

  // --- 1. TITLE PAGE ---
  // Page 1 (Right-hand side)
  drawCenteredWrappedText(book.title, 32, height * 0.3, "times", true);
  drawCenteredWrappedText(book.subtitle, 16, height * 0.42, "times", false);
  
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "normal");
  pdf.text(`By ${book.author}`, width / 2, height * 0.85, { align: "center" });

  // --- 2. COPYRIGHT & INTRO PAGE ---
  pdf.addPage(); // Page 2 (Left-hand side / Back of title)
  
  // Center Introduction Header
  const introY = height * 0.15;
  pdf.setFont("times", "bold");
  pdf.setFontSize(22);
  pdf.text("Introduction", width / 2, introY, { align: "center" });
  
  // Wrapped Introduction Text
  const introTextY = introY + 50;
  drawCenteredWrappedText(book.introduction, 12, introTextY, "helvetica", false);

  // Copyright at the bottom center, well within margins
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  const copyrightLines = pdf.splitTextToSize(book.copyrightText, contentWidth);
  copyrightLines.forEach((line: string, index: number) => {
    pdf.text(line, width / 2, height - margin - (copyrightLines.length - 1 - index) * 12, { align: "center" });
  });

  // --- 3. COLORING PAGES ---
  // Each drawing on its own page.
  for (const page of book.pages) {
    pdf.addPage();
    
    // Fit the image within KDP safe margins (3:4 aspect ratio)
    const imgWidth = contentWidth;
    let finalWidth = imgWidth;
    let finalHeight = (finalWidth / 3) * 4;
    
    const maxHeight = height - (margin * 2.5); // Extra vertical safety

    if (finalHeight > maxHeight) {
      finalHeight = maxHeight;
      finalWidth = (finalHeight / 4) * 3;
    }
    
    // Center it on the page within safe zones
    const xPos = (width - finalWidth) / 2;
    const yPos = (height - finalHeight) / 2;
    
    try {
      pdf.addImage(page.imageUrl, 'PNG', xPos, yPos, finalWidth, finalHeight);
    } catch (e) {
      console.error("Error adding image to PDF", e);
    }
  }

  return pdf.output('blob');
};
