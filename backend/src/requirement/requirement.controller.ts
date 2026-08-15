import { Controller, Post, Body, UseGuards, Request, Get, Param, Put, Delete, Query, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { RequirementService } from './requirement.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info) {
    return user;
  }
}

@Controller('requirements')
export class RequirementController {
  constructor(private readonly requirementService: RequirementService) {}

  @Get('public')
  async getPublicRequirements(@Query() query: any) {
    return this.requirementService.getPublicRequirements(query);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async submitForm(@Request() req, @Body() body: any) {
    // Add the user's ID to the payload if they are logged in
    const payload = { ...body, userId: req.user?.id };
    return this.requirementService.createRequirement(payload);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyRequirements(@Request() req) {
    return this.requirementService.getMyRequirements(req.user.id);
  }
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getRequirement(@Request() req, @Param('id') id: string) {
    return this.requirementService.getRequirementById(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateRequirement(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.requirementService.updateRequirement(req.user.id, id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteRequirement(@Request() req, @Param('id') id: string) {
    return this.requirementService.deleteRequirement(req.user.id, id);
  }
}
