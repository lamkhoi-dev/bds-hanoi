import { Controller, Post, Get, Body, Param, UseGuards, Request, Delete } from '@nestjs/common';
import { CommentService } from './comment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('properties/:id/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  async getComments(@Param('id') propertyId: string) {
    return this.commentService.getCommentsByProperty(propertyId);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 req per minute per IP
  @Post()
  async addComment(
    @Request() req, 
    @Param('id') propertyId: string, 
    @Body('content') content: string,
    @Body('parentId') parentId?: string
  ) {
    return this.commentService.createComment(req.user.id, propertyId, content, parentId);
  }
  @UseGuards(JwtAuthGuard)
  @Delete(':commentId')
  async removeComment(
    @Request() req,
    @Param('id') propertyId: string,
    @Param('commentId') commentId: string
  ) {
    return this.commentService.deleteComment(req.user.id, propertyId, commentId);
  }
}
