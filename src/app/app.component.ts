import { Component, ElementRef, ViewChild } from '@angular/core';
import { PdfViewerComponent, PDFDocumentProxy } from 'ng2-pdf-viewer';
import { PDFDocument } from 'pdf-lib';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  pdfSrc = '/assets/politica.pdf'; // Caminho do PDF
  @ViewChild('signatureBox') signatureBox!: ElementRef;
  @ViewChild(PdfViewerComponent, { static: false }) pdfViewer!: PdfViewerComponent;
  @ViewChild('pdfWrapper') pdfWrapper!: ElementRef;

  selectedPage: string = '1';
  signatureLeft: number = 0;  
  signatureTop: number = 0;  
  isDragging: boolean = false;
  startX: number = 0;
  startY: number = 0;
  startLeft: number = 0;
  startTop: number = 0;
  scrollThreshold: number = 50; // Limite para ativar a rolagem
  pdf: PDFDocumentProxy | null = null; // Instância do PDF após o carregamento

  constructor() {}

  
  
  
  get signatureBoxPosition(): string {
    return `Left: ${this.signatureLeft}px, Top: ${this.signatureTop}px`;
  }

  onMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startLeft = this.signatureLeft;
    this.startTop = this.signatureTop;
  }
  
  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;
    
    const offsetX = event.clientX - this.startX;
    const offsetY = event.clientY - this.startY;
    
    this.signatureLeft = this.startLeft + offsetX;
    this.signatureTop = this.startTop + offsetY;
    
    this.handleScroll(event.clientY);
  }
  
  onMouseUp(event: MouseEvent) {
    this.isDragging = false;
  }
  
 
  handleScroll(y: number) {
    const pdfWrapper = this.pdfWrapper.nativeElement;
    const rect = pdfWrapper.getBoundingClientRect();
    if (y < rect.top + this.scrollThreshold) {
      pdfWrapper.scrollTop -= this.scrollThreshold;
    } else if (y > rect.bottom - this.scrollThreshold) {
      pdfWrapper.scrollTop += this.scrollThreshold;
    }
  }
  
  
  
  
  
  
  

  
  

  async assinar() {
    if (this.pdf) {
      const currentPage = this.pdfViewer.pdfViewer.currentPageNumber;
      const signatureCoordinates = {
        x: this.signatureLeft,
        y: this.signatureTop,
      };

      const pdfBytes = await this.analisarPdf();
      const newPdfBytes = await this.criarAssinatura(pdfBytes, currentPage, signatureCoordinates);
      this.downloadPdf(newPdfBytes, 'documento_com_carimbo.pdf');
    }
  }

  async analisarPdf(): Promise<Uint8Array> {
    const pdfData = await fetch(this.pdfSrc);
    const arrayBuffer = await pdfData.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  async criarAssinatura(pdfBytes: Uint8Array, page: number, stampPosition: { x: number, y: number }): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const firstPage = pdfDoc.getPages()[page - 1];

    // Carregar a imagem do carimbo
    const imageUrl = 'assets/carimbo.png'; // Substitua pela URL da imagem do carimbo
    const imageBytes = await fetch(imageUrl).then(res => res.arrayBuffer());
    const image = await pdfDoc.embedPng(imageBytes);

    // Desenhar a imagem do carimbo na página do documento PDF
    firstPage.drawImage(image, {
      x: stampPosition.x,
      y: firstPage.getHeight() - stampPosition.y,
    });

    // Salvar o documento PDF com o carimbo adicionado
    return await pdfDoc.save();
  }

  downloadPdf(pdfBytes: Uint8Array, fileName: string) {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}
