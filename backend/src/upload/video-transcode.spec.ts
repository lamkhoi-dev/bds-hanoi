import { EventEmitter } from 'events';

jest.mock('child_process', () => ({ spawn: jest.fn() }));
import { spawn } from 'child_process';
import { buildFfmpegArgs, transcodeVideo, TranscodeBusyError, TranscodeFailedError, MAX_WAITING } from './video-transcode';
import { normalizePropertyPayload } from '../property/property-utils';

/** Tiến trình ffmpeg giả: test tự quyết lúc nào nó kết thúc, với mã thoát nào. */
function fakeProc() {
  const proc: any = new EventEmitter();
  proc.stderr = new EventEmitter();
  proc.kill = jest.fn();
  return proc;
}

describe('buildFfmpegArgs', () => {
  const args = buildFfmpegArgs('/tmp/in.bin', '/tmp/out.mp4');

  it('đọc file vào và ghi ra đúng đường dẫn', () => {
    expect(args[args.indexOf('-i') + 1]).toBe('/tmp/in.bin');
    expect(args[args.length - 1]).toBe('/tmp/out.mp4');
  });

  it('ra MP4 H.264 + AAC, faststart — tổ hợp mọi trình duyệt/iOS đều phát được', () => {
    expect(args).toEqual(expect.arrayContaining(['-c:v', 'libx264', '-c:a', 'aac', '-pix_fmt', 'yuv420p']));
    expect(args[args.indexOf('-movflags') + 1]).toBe('+faststart');
  });

  it('khống chế CẠNH DÀI ≤ 1280 cho cả video ngang lẫn dọc (quay điện thoại)', () => {
    const vf = args[args.indexOf('-vf') + 1];
    expect(vf).toContain('min(1280,iw)');
    expect(vf).toContain('min(1280,ih)');
    // Kích thước chẵn (-2) — yuv420p không nhận số lẻ.
    expect(vf).toContain('-2');
  });

  it('chỉ lấy 1 luồng hình và 1 luồng tiếng (tiếng có thể không có)', () => {
    expect(args.join(' ')).toContain('-map 0:v:0 -map 0:a:0?');
  });
});

/** `transcodeVideo` là async: ffmpeg chỉ được spawn sau một nhịp — phải chờ trước khi phát sự kiện. */
const tick = () => new Promise((r) => setImmediate(r));

describe('transcodeVideo', () => {
  const spawnMock = spawn as unknown as jest.Mock;
  beforeEach(() => spawnMock.mockReset());

  it('mã thoát 0 thì thành công', async () => {
    const proc = fakeProc();
    spawnMock.mockReturnValue(proc);
    const done = transcodeVideo('/in', '/out');
    await tick();
    proc.emit('close', 0);
    await expect(done).resolves.toBeUndefined();
  });

  it('mã thoát khác 0 thì báo lỗi kèm đoạn cuối log ffmpeg', async () => {
    const proc = fakeProc();
    spawnMock.mockReturnValue(proc);
    const done = transcodeVideo('/in', '/out');
    await tick();
    proc.stderr.emit('data', Buffer.from('Invalid data found when processing input'));
    proc.emit('close', 1);
    await expect(done).rejects.toThrow(/Invalid data found/);
    await expect(done).rejects.toBeInstanceOf(TranscodeFailedError);
  });

  it('không có ffmpeg trong máy thì báo lỗi rõ ràng, không treo', async () => {
    const proc = fakeProc();
    spawnMock.mockReturnValue(proc);
    const done = transcodeVideo('/in', '/out');
    await tick();
    proc.emit('error', new Error('spawn ffmpeg ENOENT'));
    await expect(done).rejects.toThrow(/ffmpeg/);
  });

  it('chỉ nén MỘT video mỗi lúc; hàng chờ đầy thì báo bận', async () => {
    const procs: any[] = [];
    spawnMock.mockImplementation(() => {
      const p = fakeProc();
      procs.push(p);
      return p;
    });

    // 1 đang nén + MAX_WAITING đang chờ = đầy.
    const running = transcodeVideo('/in0', '/out0');
    const waiting = Array.from({ length: MAX_WAITING }, (_, i) => transcodeVideo(`/in${i + 1}`, `/out${i + 1}`));
    await tick();
    expect(spawnMock).toHaveBeenCalledTimes(1);

    // Người thứ MAX_WAITING+2 bị từ chối ngay, không xếp hàng.
    await expect(transcodeVideo('/inX', '/outX')).rejects.toBeInstanceOf(TranscodeBusyError);

    // Xong người đầu thì người kế mới bắt đầu.
    procs[0].emit('close', 0);
    await running;
    await tick();
    expect(spawnMock).toHaveBeenCalledTimes(2);

    // Dọn hết để không để lại lượt chờ treo trong hàng đợi của module.
    for (let i = 1; i <= MAX_WAITING; i++) {
      await tick();
      procs[i].emit('close', 0);
    }
    await Promise.all(waiting);
  });
});

describe('normalizePropertyPayload — videoUrl', () => {
  it('nhận URL video do máy chủ trả về (tuyệt đối hoặc tương đối)', () => {
    const abs = normalizePropertyPayload({ videoUrl: 'https://sanbdshanoi.vn/bds-uploads/video-1759000000000-123456789.mp4' });
    const rel = normalizePropertyPayload({ videoUrl: '/bds-uploads/video-1759000000000-123456789.mp4' });
    expect(abs.videoUrl).toBe('https://sanbdshanoi.vn/bds-uploads/video-1759000000000-123456789.mp4');
    expect(rel.videoUrl).toBe('/bds-uploads/video-1759000000000-123456789.mp4');
  });

  it('chuỗi rỗng / null / dạng lạ đều thành NULL (= gỡ video khỏi tin)', () => {
    expect(normalizePropertyPayload({ videoUrl: '' }).videoUrl).toBeNull();
    expect(normalizePropertyPayload({ videoUrl: null }).videoUrl).toBeNull();
    expect(normalizePropertyPayload({ videoUrl: 'javascript:alert(1)' }).videoUrl).toBeNull();
    expect(normalizePropertyPayload({ videoUrl: 'https://evil.example/tro-lien-ket.mp4' }).videoUrl).toBeNull();
  });

  it('payload không nhắc tới videoUrl thì KHÔNG đụng tới (sửa tin không làm mất video)', () => {
    const out = normalizePropertyPayload({ title: 'Nhà đẹp' });
    expect('videoUrl' in out).toBe(false);
  });
});
