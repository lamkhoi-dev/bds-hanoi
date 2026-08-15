import { Controller, Get, Query } from '@nestjs/common';
import { LocationService } from './location.service';

@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get()
  async getLocations(@Query('city') city?: string) {
    return this.locationService.getLocations(city);
  }

  @Get('seed-hatinh')
  async seedHaTinh() {
    return this.locationService.seedHaTinh();
  }
}
