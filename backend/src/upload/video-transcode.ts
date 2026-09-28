import { spawn } from 'child_process';

/**
 * Nén video tin đăng (khách 27/9: "hỗ trợ tải lên và xem video, giới hạn 100MB").
 *
 * Vì sao phải nén ở máy chủ: video quay bằng điện thoại thường 10–15 MB/phút, mà VPS chỉ có
 * vài GB trống dùng chung với ảnh. Đổi hết về H.264 tối đa 720p (cạnh dài ≤ 1280) + AAC 96k
 * thì còn khoảng 1/3–1/5, và `+faststart` đưa metadata lên đầu file để phát được ngay khi
 * đang tải, không phải chờ hết file. MP4/H.264/AAC là tổ hợp duy nhất mọi trình duyệt +
 * iOS đều phát được — nên MOV/WebM khách tải lên cũng được đổi về đây.
 */

/** Dung lượng file video khách được tải lên (trước khi nén). */
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

/** Quá thời gian này thì giết ffmpeg — đề phòng file lạ làm treo CPU của VPS nhỏ. */
export const TRANSCODE_TIMEOUT_MS = 8 * 60 * 1000;

/** Tối đa số người chờ nén cùng lúc (không tính người đang nén). Đầy thì báo bận. */
export const MAX_WAITING = 2;

export function buildFfmpegArgs(inputPath: string, outputPath: string): string[] {
  // Cạnh dài ≤ 1280, không phóng to, giữ chẵn (yuv420p bắt buộc kích thước chẵn).
  // Ngang: khống chế bề rộng; dọc (quay điện thoại): khống chế bề cao.
  const scale = "scale='if(gt(iw,ih),min(1280,iw),-2)':'if(gt(iw,ih),-2,min(1280,ih))'";
  return [
    '-y',
    '-i', inputPath,
    // Chỉ lấy 1 luồng hình + 1 luồng tiếng (nếu có); bỏ phụ đề, dữ liệu đính kèm.
    '-map', '0:v:0',
    '-map', '0:a:0?',
    '-vf', scale,
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '28',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '96k',
    '-ac', '2',
    '-movflags', '+faststart',
    '-threads', '2',
    '-f', 'mp4',
    outputPath,
  ];
}

export class TranscodeBusyError extends Error {
  constructor() {
    super('Hệ thống đang nén nhiều video, vui lòng thử lại sau ít phút.');
  }
}

export class TranscodeFailedError extends Error {}

let running = false;
const waiters: Array<() => void> = [];

/**
 * Mỗi lúc chỉ nén MỘT video: ffmpeg ăn hết CPU của VPS nhỏ, cho chạy song song thì cả site
 * (và các lượt nén) đều chậm. Người sau xếp hàng, hàng quá `MAX_WAITING` thì báo bận.
 */
async function acquire(): Promise<void> {
  if (!running) {
    running = true;
    return;
  }
  if (waiters.length >= MAX_WAITING) throw new TranscodeBusyError();
  await new Promise<void>((resolve) => waiters.push(resolve));
}

function release(): void {
  const next = waiters.shift();
  if (next) next(); // giữ nguyên `running = true`, nhường lượt cho người kế
  else running = false;
}

export async function transcodeVideo(inputPath: string, outputPath: string): Promise<void> {
  await acquire();
  try {
    await new Promise<void>((resolve, reject) => {
      const proc = spawn('ffmpeg', buildFfmpegArgs(inputPath, outputPath), { stdio: ['ignore', 'ignore', 'pipe'] });
      let stderrTail = '';
      proc.stderr.on('data', (chunk) => {
        // Chỉ giữ đoạn cuối để báo lỗi, không tích cả log dài của ffmpeg.
        stderrTail = (stderrTail + chunk.toString()).slice(-1500);
      });
      const timer = setTimeout(() => {
        proc.kill('SIGKILL');
        reject(new TranscodeFailedError('Nén video quá lâu, đã huỷ.'));
      }, TRANSCODE_TIMEOUT_MS);
      proc.on('error', (err) => {
        clearTimeout(timer);
        reject(new TranscodeFailedError(`Không chạy được ffmpeg: ${err.message}`));
      });
      proc.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) resolve();
        else reject(new TranscodeFailedError(`ffmpeg lỗi (mã ${code}): ${stderrTail}`));
      });
    });
  } finally {
    release();
  }
}
