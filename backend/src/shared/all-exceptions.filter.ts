import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

function translateMessage(msg: string): string {
  if (typeof msg !== 'string') return msg;
  let t = msg;
  
  // Custom field names mapping
  t = t.replace(/^bedrooms/, 'Số phòng ngủ');
  t = t.replace(/^bathrooms/, 'Số phòng tắm');
  t = t.replace(/^floors/, 'Số tầng');
  t = t.replace(/^frontage/, 'Mặt tiền');
  t = t.replace(/^roadWidth/, 'Đường vào');
  t = t.replace(/^title/, 'Tiêu đề');
  t = t.replace(/^description/, 'Mô tả');
  t = t.replace(/^price/, 'Giá');
  t = t.replace(/^area/, 'Diện tích');
  t = t.replace(/^phone/, 'Số điện thoại');
  t = t.replace(/^name/, 'Họ tên');
  t = t.replace(/^password/, 'Mật khẩu');
  t = t.replace(/^propertyType/, 'Loại bất động sản');
  t = t.replace(/^transactionType/, 'Hình thức giao dịch');
  t = t.replace(/^city/, 'Tỉnh/Thành phố');
  t = t.replace(/^district/, 'Quận/Huyện');
  t = t.replace(/^ward/, 'Phường/Xã');
  t = t.replace(/^street/, 'Đường/Phố');
  t = t.replace(/^content/, 'Nội dung');
  t = t.replace(/^subject/, 'Tiêu đề');

  // Constraints mapping
  t = t.replace(/must not be less than 0/, 'không được nhỏ hơn 0');
  t = t.replace(/must be a number conforming to the specified constraints/, 'phải là một số hợp lệ');
  t = t.replace(/must be a number string/, 'phải là số');
  t = t.replace(/must be a number/, 'phải là số');
  t = t.replace(/should not be empty/, 'không được để trống');
  t = t.replace(/must be a string/, 'phải là văn bản');
  t = t.replace(/must be an array/, 'phải là danh sách');
  t = t.replace(/must be a boolean/, 'phải là đúng/sai');
  t = t.replace(/is not valid/, 'không hợp lệ');
  
  // Standard HTTP errors
  t = t.replace(/^Internal server error$/i, 'Hệ thống đang gặp sự cố, vui lòng thử lại sau.');
  t = t.replace(/^Unauthorized$/i, 'Bạn cần đăng nhập để thực hiện thao tác này.');
  t = t.replace(/^Forbidden$/i, 'Bạn không có quyền thực hiện thao tác này.');
  t = t.replace(/^Not Found$/i, 'Không tìm thấy dữ liệu yêu cầu.');
  t = t.replace(/^Bad Request$/i, 'Dữ liệu không hợp lệ.');

  return t.charAt(0).toUpperCase() + t.slice(1);
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    if (exception && typeof exception === 'object' && 'code' in exception) {
      if ((exception as any).code === 'P2002') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Dữ liệu đã tồn tại trong hệ thống (Duplicate).';
      } else if ((exception as any).code === 'P2003') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Dữ liệu tham chiếu không hợp lệ (Lỗi khóa ngoại).';
      } else if ((exception as any).code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Không tìm thấy dữ liệu yêu cầu.';
      }
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Unhandled exception at ${request.url}: ${
          exception instanceof Error ? exception.message : JSON.stringify(exception)
        }`,
        exception instanceof Error ? exception.stack : '',
      );
    }

    let finalMessage = typeof message === 'string' ? message : (message as any)?.message || message;
    
    if (Array.isArray(finalMessage)) {
      finalMessage = 'Vui lòng kiểm tra lại:\n- ' + finalMessage.map(translateMessage).join('\n- ');
    } else if (typeof finalMessage === 'string') {
      finalMessage = translateMessage(finalMessage);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: finalMessage,
    });
  }
}

