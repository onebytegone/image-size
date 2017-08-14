'use strict';

// Based on the spec found at:
// - https://en.wikipedia.org/wiki/JPEG_XR
// - http://www.itu.int/rec/T-REC-T.832-201608-I/en

function isJXR(buffer){
   // Source: https://msdn.microsoft.com/en-us/library/windows/desktop/gg430023.aspx
   // - 0x4949bc00 (Pre-release)
   // - 0x4949bc01 (Version 1.0)
   return buffer.readUInt32BE(0) >> 8 === 0x4949bc;
}

function getImageHeader (buffer) {
   var index = buffer.indexOf('WMPHOTO', 'ascii'),
       header = {};

   if (index === -1) {
      return undefined;
   }

   header.shortImageHeaderFlag = !!(buffer.readUInt8(index + 10) >> 7);

   if (header.shortImageHeaderFlag) {
       header.widthMinusOne = buffer.readUInt16BE(index + 12);
       header.heightMinusOne = buffer.readUInt16BE(index + 14);
   } else {
       header.widthMinusOne = buffer.readUInt32BE(index + 12);
       header.heightMinusOne = buffer.readUInt32BE(index + 16);
   }

   header.width = header.widthMinusOne + 1;
   header.height = header.heightMinusOne + 1;

   return header;
}

function calculate(buffer){
   var header = getImageHeader(buffer);

   return {
      'height': header.height,
      'width': header.width
   };
}

module.exports = {
   'detect': isJXR,
   'calculate': calculate
};
