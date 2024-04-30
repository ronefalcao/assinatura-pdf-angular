import { Injectable } from '@angular/core';
import { PDFDocument, rgb } from 'pdf-lib';

@Injectable({
  providedIn: 'root'
})
export class AppService {
    constructor() {}

    async loadPdf(url: string): Promise<Uint8Array> {
      const pdfData = await fetch(url);
      const arrayBuffer = await pdfData.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    }
  
    async signPdf(pdfBytes: Uint8Array, signatureCoordinates: { x: number, y: number }): Promise<Uint8Array> {
      const pdfDoc = await PDFDocument.load(pdfBytes);
  
      // Carregar a imagem do carimbo
      const imageUrl = 'assets/carimbo.png'; // Substitua pela URL da imagem do carimbo
      const imageBytes = await fetch(imageUrl).then(res => res.arrayBuffer());
      const image = await pdfDoc.embedPng(imageBytes);
  
      // Desenhar a imagem do carimbo na página do documento PDF
      const firstPage = pdfDoc.getPages()[0]; // Assinando apenas na primeira página
      const stampHeight = 66; // Altura do carimbo
      firstPage.drawImage(image, {
        x: signatureCoordinates.x,
        y: firstPage.getHeight() - signatureCoordinates.y - stampHeight,
      });
  
      // Salvar o documento PDF com o carimbo adicionado
      return await pdfDoc.save();
    }
  }