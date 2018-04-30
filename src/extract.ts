import { NameTable } from './tables/name';
import { OS2Table } from './tables/os2';

export enum Type {
    Serif = 'serif',
    SansSerif = 'sansSerif',
    Monospace = 'monospace',
    Cursive = 'cursive',
    Unknown = 'unknown'
}

export enum Style {
    Regular = 'regular',
    Italic = 'italic',
    Oblique = 'oblique',
    Bold = 'bold',
    BoldItalic = 'boldItalic',
    BoldOblique = 'boldOblique',
    Other = 'other'
}

const standardEndings = [
    ' Regular',
    ' Bold',
    ' Bold Italic',
    ' Bold Oblique',
    ' Italic',
    ' Oblique'
];

export function name(names: NameTable, language: string): string {
    const family = names.preferredFamily && names.preferredFamily[language]
        ? names.preferredFamily[language]
        : names.fontFamily[language];
    const subfamily = names.preferredSubfamily && names.preferredSubfamily[language]
        ? names.preferredSubfamily[language]
        : names.fontSubfamily[language];
    const fullName = `${family} ${subfamily}`;

    for (const ending of standardEndings) {
        if (fullName.endsWith(ending)) {
            return fullName.substring(0, fullName.length - ending.length);
        }
    }

    return fullName;
}

export function type(os2: OS2Table): Type {
    // Panose specification: https://monotype.github.io/panose/pan1.htm
    switch (os2.panose[0]) {
        case 2:
            // https://monotype.github.io/panose/pan2.htm#_Toc380547256
            if (os2.panose[3] === 9) {
                return Type.Monospace;
            }

            // https://monotype.github.io/panose/pan2.htm#Sec2SerifStyle
            if (os2.panose[1] >= 11 && os2.panose[1] <= 15 || os2.panose[1] === 0) {
                return Type.SansSerif;
            }

            return Type.Serif;
        case 3:
            return Type.Cursive;
    }

    // TODO: better classification
    return Type.Unknown;
}

// https://docs.microsoft.com/en-us/typography/opentype/spec/os2#fsselection
export function style(os2: OS2Table): Style {
    const bold = os2.fsSelection & 0x20;        // Bit 5
    const italic = os2.fsSelection & 0x01;      // Bit 0
    const oblique = os2.fsSelection & 0x200;    // Bit 9
    const regular = os2.fsSelection & 0x140;    // Bit 6 or 8 (WWS)

    if (bold) {
        // Oblique has to come before italic for it to get picked up
        if (oblique) {
            return Style.BoldOblique;
        }

        if (italic) {
            return Style.BoldItalic;
        }

        return Style.Bold;
    }

    // Oblique has to come before italic for it to get picked up
    if (oblique) {
        return Style.Oblique;
    }

    if (italic) {
        return Style.Italic;
    }

    if (regular) {
        return Style.Regular;
    }

    // TODO: better classification
    return Style.Other;
}
