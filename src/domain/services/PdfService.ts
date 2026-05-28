export interface PdfService {
    generateSchedulePdf(scheduleData: any): Promise<Buffer>;
}