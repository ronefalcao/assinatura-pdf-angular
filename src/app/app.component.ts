import { Component, ElementRef, ViewChild } from '@angular/core';
import { PdfViewerComponent, PDFDocumentProxy } from 'ng2-pdf-viewer';
import { PDFDocument } from 'pdf-lib';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  isLoading: boolean = false;
  currentPage: number = 1;

  pdfSrc = '/assets/politica.pdf'; // Caminho do PDF
  @ViewChild('signatureBox') signatureBox!: ElementRef;
  @ViewChild(PdfViewerComponent, { static: false })
  pdfViewer!: PdfViewerComponent;
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

  ngOnInit() {
    this.loadPDF();
  }

  loadPDF() {
    this.isLoading = true;
    // Simula o carregamento
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

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

  async criarAssinatura(): Promise<void> {


    try {
      const existingPdfBytes = await fetch(this.pdfSrc).then((res) =>
        res.arrayBuffer()
      );
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      const currentPageIndex = this.currentPage - 1; // Convertendo de 1-base para 0-base

      // Utilize currentPageIndex para acessar a página correta
      const page = pages[currentPageIndex];

      const imageUrl = '/assets/carimbo.png';
      const imageBytes = await fetch(imageUrl).then((res) => res.arrayBuffer());
      const image = await pdfDoc.embedPng(imageBytes);

      page.drawImage(image, {
        x: this.signatureLeft, // Coordenadas x da assinatura
        y: page.getHeight() - this.signatureTop - 66, // Coordenadas y da assinatura
        width: image.width,
        height: image.height,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error creating signature:', error);
    }
  }

  async analisarPdf(): Promise<Uint8Array> {
    const pdfData = await fetch(this.pdfSrc);
    const arrayBuffer = await pdfData.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }
}
