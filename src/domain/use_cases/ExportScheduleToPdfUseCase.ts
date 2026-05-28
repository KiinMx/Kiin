import { PdfService } from '../services/PdfService';
import { ScheduleRepository } from '../repositories/ScheduleRepository';

export class ExportScheduleToPdfUseCase {
    constructor(
        private scheduleRepository: ScheduleRepository,
        private pdfService: PdfService
    ) { }

    async execute(scheduleId: string): Promise<Buffer> {
        const schedule = await this.scheduleRepository.getById(scheduleId);
        if (!schedule) {
            throw new Error("Schedule not found");
        }
        return await this.pdfService.generateSchedulePdf(schedule);
    }
}