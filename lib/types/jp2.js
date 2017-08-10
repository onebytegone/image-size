'use strict';

// NOTE: This is a rough implementation for detecting JP2 images. More validation could be added.
//
// Based on:
// http://www.file-recovery.com/jp2-signature-format.htm
// https://en.wikipedia.org/wiki/JPEG_2000
// https://github.com/plroit/Skyreach/wiki/Introduction-to-JPEG2000-Structure-and-Layout
// http://openpreservation.org/blog/2011/12/14/prototype-jp2-validator-and-properties-extractor/
// https://github.com/openpreserve/jpylyzer/blob/36a3d63abab3179579121410be3637b7e6926eb9/jpylyzer/jpylyzer.py
// https://github.com/openpreserve/jpylyzer/blob/36a3d63abab3179579121410be3637b7e6926eb9/jpylyzer/boxvalidator.py

var BOX_LENGTH_FIELD = 4,
    BOX_TYPE_LENGTH = 4;

function indexOfBox (buffer, boxType) {
   var index = buffer.indexOf(boxType, 'ascii');

   if (index === -1) {
      return -1;
   }

   // Lookback to add bytes indicating box length
   return index - BOX_LENGTH_FIELD;
}

function readBox (buffer, offset) {
   var lengthStart = offset,
       typeStart = offset + BOX_LENGTH_FIELD,
       dataStart = typeStart + BOX_TYPE_LENGTH,
       length = buffer.readUIntBE(lengthStart, BOX_LENGTH_FIELD),
       type = buffer.toString('ascii', typeStart, typeStart + BOX_TYPE_LENGTH);

   return {
      type: type,
      length: length,
      end: offset + length,
      data: buffer.slice(dataStart, offset + length),
   };
}

function lookupBox (buffer, boxType) {
   var index = indexOfBox(buffer, boxType);

   if (index === -1) {
      return undefined;
   }

   return readBox(buffer, index);
}

function isJPG2000 (buffer) {
   var signature = lookupBox(buffer, 'jP  '), // 0x6a502020
       fileType = lookupBox(buffer, 'ftyp'), // 0x66747970
       jp2Header = lookupBox(buffer, 'jp2h'); // 0x6a703268

   return signature && fileType && jp2Header;
}

function calculate (buffer) {
   var jp2Header = lookupBox(buffer, 'jp2h'), // 0x6a703268
       imageHeader = jp2Header && lookupBox(jp2Header.data, 'ihdr'); // 0x69686472

   if (!imageHeader || !imageHeader.data) {
      throw new TypeError('Invalid JP2, no size found');
   }

   return {
      'height': imageHeader.data.readUInt32BE(),
      'width': imageHeader.data.readUInt32BE(4),
   };
}

module.exports = {
  'detect': isJPG2000,
  'calculate': calculate
};
