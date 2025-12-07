// Type definitions for Web NFC API
// https://w3c.github.io/web-nfc/

interface NDEFMessage {
  records: NDEFRecord[];
}

interface NDEFRecord {
  recordType: string;
  mediaType?: string;
  id?: string;
  data?: string | ArrayBuffer | DataView;
}

interface NDEFWriter {
  write(message: NDEFMessage): Promise<void>;
}

interface NDEFReader {
  scan(): Promise<void>;
  onreading: ((event: NDEFReadingEvent) => void) | null;
  onreadingerror: ((error: Event) => void) | null;
}

interface NDEFReadingEvent {
  message: NDEFMessage;
  serialNumber?: string;
}

declare var NDEFWriter: {
  prototype: NDEFWriter;
  new(): NDEFWriter;
};

declare var NDEFReader: {
  prototype: NDEFReader;
  new(): NDEFReader;
};

// Make NDEFWriter and NDEFReader available globally
declare global {
  var NDEFWriter: {
    prototype: NDEFWriter;
    new(): NDEFWriter;
  };
  
  var NDEFReader: {
    prototype: NDEFReader;
    new(): NDEFReader;
  };
}

interface Window {
  NDEFWriter: typeof NDEFWriter;
  NDEFReader: typeof NDEFReader;
}

