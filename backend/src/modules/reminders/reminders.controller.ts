import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RemindersService } from './reminders.service';
import { ReminderSettingsService } from './reminder-settings.service';
import { ReminderTemplateService } from './reminder-template.service';
import { ReminderAnalyticsService } from './reminder-analytics.service';
import {
  CreateReminderSettingsDto,
  UpdateReminderSettingsDto,
  CreateReminderTemplateDto,
  UpdateReminderTemplateDto,
} from './dtos';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Reminders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reminders')
export class RemindersController {
  constructor(
    private readonly remindersService: RemindersService,
    private readonly settingsService: ReminderSettingsService,
    private readonly templateService: ReminderTemplateService,
    private readonly analyticsService: ReminderAnalyticsService,
  ) {}

  @Get('settings/:businessId')
  @ApiOperation({ summary: 'Get all reminder settings for a business' })
  async getSettings(@Param('businessId') businessId: string) {
    const businessIdNum = parseInt(businessId, 10);
    if (isNaN(businessIdNum)) {
      throw new BadRequestException('Invalid business ID');
    }
    return this.settingsService.getAllSettings(businessIdNum);
  }

  @Post('settings/:businessId')
  @ApiOperation({ summary: 'Create or update reminder settings' })
  async createOrUpdateSettings(
    @Param('businessId') businessId: string,
    @Body() createDto: CreateReminderSettingsDto,
  ) {
    const businessIdNum = parseInt(businessId, 10);
    if (isNaN(businessIdNum)) {
      throw new BadRequestException('Invalid business ID');
    }
    return this.settingsService.createSetting(businessIdNum, createDto);
  }

  @Put('settings/:id')
  @ApiOperation({ summary: 'Update reminder settings by ID' })
  async updateSettings(@Param('id') id: string, @Body() updateDto: UpdateReminderSettingsDto) {
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      throw new BadRequestException('Invalid settings ID');
    }
    return this.settingsService.updateSetting(idNum, updateDto);
  }

  @Put('settings/:id/toggle')
  @ApiOperation({ summary: 'Toggle reminder settings on/off' })
  async toggleSettings(@Param('id') id: string) {
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      throw new BadRequestException('Invalid settings ID');
    }
    return this.settingsService.toggleSetting(idNum);
  }

  @Delete('settings/:id')
  @ApiOperation({ summary: 'Delete reminder settings' })
  async deleteSettings(@Param('id') id: string) {
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      throw new BadRequestException('Invalid settings ID');
    }
    await this.settingsService.deleteSetting(idNum);
    return { message: 'Settings deleted successfully' };
  }

  @Get('templates/:businessId')
  @ApiOperation({ summary: 'Get all reminder templates for a business' })
  async getTemplates(@Param('businessId') businessId: string) {
    const businessIdNum = parseInt(businessId, 10);
    if (isNaN(businessIdNum)) {
      throw new BadRequestException('Invalid business ID');
    }
    return this.templateService.getAllTemplates(businessIdNum);
  }

  @Get('templates/detail/:id')
  @ApiOperation({ summary: 'Get a specific template by ID' })
  async getTemplate(@Param('id') id: string) {
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      throw new BadRequestException('Invalid template ID');
    }
    return this.templateService.getTemplate(idNum);
  }

  @Post('templates/:businessId')
  @ApiOperation({ summary: 'Create a new reminder template' })
  async createTemplate(
    @Param('businessId') businessId: string,
    @Body() createDto: CreateReminderTemplateDto,
  ) {
    const businessIdNum = parseInt(businessId, 10);
    if (isNaN(businessIdNum)) {
      throw new BadRequestException('Invalid business ID');
    }
    return this.templateService.createTemplate(businessIdNum, createDto);
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Update a reminder template' })
  async updateTemplate(@Param('id') id: string, @Body() updateDto: UpdateReminderTemplateDto) {
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      throw new BadRequestException('Invalid template ID');
    }
    return this.templateService.updateTemplate(idNum, updateDto);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete a reminder template' })
  async deleteTemplate(@Param('id') id: string) {
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      throw new BadRequestException('Invalid template ID');
    }
    await this.templateService.deleteTemplate(idNum);
    return { message: 'Template deleted successfully' };
  }

  @Post('templates/:id/reset')
  @ApiOperation({ summary: 'Reset template to default' })
  async resetTemplate(@Param('id') id: string) {
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      throw new BadRequestException('Invalid template ID');
    }
    const template = await this.templateService.getTemplate(idNum);
    return this.templateService.resetTemplateToDefault(template.businessId, template.type);
  }

  @Get('logs/:businessId')
  @ApiOperation({ summary: 'Get reminder logs for a business (paginated)' })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Number of records to skip',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description: 'Number of records to take',
  })
  async getLogs(
    @Param('businessId') businessId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const businessIdNum = parseInt(businessId, 10);
    if (isNaN(businessIdNum)) {
      throw new BadRequestException('Invalid business ID');
    }
    const skipNum = skip ? parseInt(skip, 10) : 0;
    const takeNum = take ? parseInt(take, 10) : 10;

    const [logs, total] = await this.remindersService.getRemindersLog(
      businessIdNum,
      skipNum,
      takeNum,
    );

    return {
      data: logs,
      pagination: {
        total,
        skip: skipNum,
        take: takeNum,
      },
    };
  }

  @Get('analytics/:businessId')
  @ApiOperation({ summary: 'Get reminder analytics for a business' })
  async getAnalytics(@Param('businessId') businessId: string) {
    const businessIdNum = parseInt(businessId, 10);
    if (isNaN(businessIdNum)) {
      throw new BadRequestException('Invalid business ID');
    }
    return this.analyticsService.getAnalyticsForBusiness(businessIdNum);
  }

  @Post('test/:businessId')
  @ApiOperation({ summary: 'Send a test reminder (to be used with WhatsApp service)' })
  async sendTestReminder(
    @Param('businessId') businessId: string,
    @Body() body: { appointmentId: number; type: string },
  ) {
    const businessIdNum = parseInt(businessId, 10);
    if (isNaN(businessIdNum)) {
      throw new BadRequestException('Invalid business ID');
    }

    return {
      message: 'Test reminder request queued',
      appointmentId: body.appointmentId,
      type: body.type,
    };
  }

  @Post('logs/:logId/resend')
  @ApiOperation({ summary: 'Manually resend a failed or pending reminder' })
  async resendReminder(@Param('logId') logId: string) {
    const logIdNum = parseInt(logId, 10);
    if (isNaN(logIdNum)) {
      throw new BadRequestException('Invalid log ID');
    }
    return this.remindersService.resendReminder(logIdNum);
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for reminders service' })
  health() {
    return { status: 'ok', timestamp: new Date() };
  }
}
