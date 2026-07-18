import { SavError } from "../limits";

/** Endian-aware sequential reader over a DataView. `little` is set by the header's layout-code probe. */
export class Cursor {
  readonly view: DataView;
  pos = 0;
  little = true;

  constructor(buf: ArrayBuffer) {
    this.view = new DataView(buf);
  }

  get length(): number {
    return this.view.byteLength;
  }

  /** Refuse a read/seek that would land outside the buffer BEFORE the DataView touches it — a hostile
   * length/offset field must surface as a catchable `SavError`, never a raw `RangeError` (the taxonomy
   * `limits.ts` promises and the adversarial suite asserts). Also bounds `new Uint8Array(n)`. */
  private ensure(n: number): void {
    if (n < 0 || this.pos + n > this.length) {
      throw new SavError(
        `read of ${n} bytes at offset ${this.pos} exceeds the ${this.length}-byte file`,
      );
    }
  }

  seek(p: number): void {
    if (p < 0 || p > this.length) throw new SavError(`seek to ${p} is outside the file`);
    this.pos = p;
  }

  skip(n: number): void {
    this.pos += n;
  }

  readI32(): number {
    this.ensure(4);
    const v = this.view.getInt32(this.pos, this.little);
    this.pos += 4;
    return v;
  }

  readF64(): number {
    this.ensure(8);
    const v = this.view.getFloat64(this.pos, this.little);
    this.pos += 8;
    return v;
  }

  /** Byte-order-aware 64-bit signed int (file offsets/lengths fit in a JS number). */
  readI64(): number {
    this.ensure(8);
    const v = this.view.getBigInt64(this.pos, this.little);
    this.pos += 8;
    return Number(v);
  }

  readBytes(n: number): Uint8Array {
    // A hostile length field (`size*count`, `labelLen`, `compressedSize`, …) can claim gigabytes.
    this.ensure(n);
    const out = new Uint8Array(n);
    out.set(new Uint8Array(this.view.buffer, this.view.byteOffset + this.pos, n));
    this.pos += n;
    return out;
  }

  readStr(n: number, dec: TextDecoder): string {
    return dec.decode(this.readBytes(n));
  }
}
