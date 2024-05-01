import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { PdfViewerComponent, PDFDocumentProxy } from 'ng2-pdf-viewer';
import { PDFDocument } from 'pdf-lib';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit{
  isLoading: boolean = false;
  currentPage: number = 1;

  pdfSrc = '/assets/politica.pdf'; // Caminho do PDF
  @ViewChild('signatureBox') signatureBox!: ElementRef;
  @ViewChild('pdfWrapper') pdfWrapper!: ElementRef;
  @ViewChild(PdfViewerComponent)
  private pdfViewerComponent!: PdfViewerComponent;

  selectedPage: string = '1';
  signatureLeft: number = 0;
  signatureTop: number = 650;
  isDragging: boolean = false;
  startX: number = 0;
  startY: number = 0;
  startLeft: number = 0;
  startTop: number = 0;
  scrollThreshold: number = 50; // Limite para ativar a rolagem
  pdf: PDFDocumentProxy | null = null; // Instância do PDF após o carregamento

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadPDF();
  }

   onPageRendered(e: any) {
    this.currentPage = e.pageNumber;
    console.log(`Current page: ${e.pageNumber}`);
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

  onMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startLeft = this.signatureLeft;
    this.startTop = this.signatureTop;
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;

    const offsetX = event.clientX - this.startX;
    const offsetY = event.clientY - this.startY;
    this.signatureLeft = this.startLeft + offsetX;
    this.signatureTop = this.startTop + offsetY;

    event.preventDefault(); // Use 'event'
  }

  onMouseUp(event: MouseEvent): void {
    this.isDragging = false;
  }

  async criarAssinatura(): Promise<void> {
    try {
      const existingPdfBytes = await fetch(this.pdfSrc).then((res) =>
        res.arrayBuffer()
      );
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      const currentPageIndex = this.currentPage - 1; // Convertendo de 1-base para 0-base
      const page = pages[currentPageIndex];

      if (!page) {
        console.error('Page not found');
        return;
      }

      const imageUrl = '/assets/carimbo.png';
      const imageBytes = await fetch(imageUrl).then((res) => res.arrayBuffer());
      const image = await pdfDoc.embedPng(imageBytes);

      if (!image) {
        console.error('Failed to load or embed the image');
        return;
      }

      page.drawImage(image, {
        x: this.signatureLeft,
        y: page.getHeight() - this.signatureTop - image.height - 90,
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
