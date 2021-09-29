// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/// @title ColorConverter
/// @author @codingwithmanny & @mannynarang
/// @notice Provides multiple functions for converting colors to different formats
library ColorConverter {

    using SafeMath for uint;
    
    // Constants
    bytes1 constant a = bytes1('a');
    bytes1 constant f = bytes1('f');
    bytes1 constant A = bytes1('A');
    bytes1 constant F = bytes1('F');
    bytes1 constant zero = bytes1('0');
    bytes1 constant nine = bytes1('9');

    /**
     * Code provided by github.com/themandalore - https://ethereum.stackexchange.com/questions/52847/parse-string-into-multiple-variables/53115#53115
     * Convert a character to its hex value as a byte. This is NOT
     * very efficient but is a brute-force way of getting the job done.
     * It's possible to optimize this with assembly in solidity but
     * that would require a lot more time.
     */
    function hexCharToByte(uint8 c) pure internal returns(uint8) {
        bytes1 b = bytes1(c);

        //convert ascii char to hex value
        if(b >= zero && b <= nine) {
            return c - uint8(zero);
        } else if(b >= a && b <= f) {
            return 10 + (c - uint8(a));
        }
        return 10 + (c - uint8(A));
    }

    /**
     * Code provided by github.com/themandalore - https://ethereum.stackexchange.com/questions/52847/parse-string-into-multiple-variables/53115#53115
     * Check whether a string has hex prefix.
     */
    function hasZeroXPrefix(string memory s) pure internal returns(bool) {
        bytes memory b = bytes(s);
        if(b.length < 2) {
            return false;
        }
        return b[1] == 'x';
    }

    /**
     * Code provided by github.com/themandalore - https://ethereum.stackexchange.com/questions/52847/parse-string-into-multiple-variables/53115#53115
     * Assumed that it accepts hex values without #
     */
    function hexToUint(string memory hexValue) pure public returns(uint) {
        //convert string to bytes
        bytes memory b = bytes(hexValue);

        //make sure zero-padded
        require(b.length % 2 == 0, "String must have an even number of characters");

        //starting index to parse from
        uint i = 0;
        //strip 0x if present
        if(hasZeroXPrefix(hexValue)) {
            i = 2;
        }
        uint r = 0;
        for(;i<b.length;i++) {
            //convert each ascii char in string to its hex/byte value.
            uint b1 = hexCharToByte(uint8(b[i]));

            //shift over a nibble for each char since hex has 2 chars per byte
            //OR the result to fill in lower 4 bits with hex byte value.
            r = (r << 4) | b1;
        }
        //result is hex-shifted value of all bytes in input string.
        return r;
    }

    /**
     * Inspired by Java code - unknown url but will find later
     * Converts a decimal value to a hex value without the #
     */
    function uintToHex (uint256 decimalValue) pure public returns (bytes memory) {
        uint remainder;
        bytes memory hexResult = "";
        string[16] memory hexDictionary = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];

        while (decimalValue > 0) {
            remainder = decimalValue % 16;
            string memory hexValue = hexDictionary[remainder];
            hexResult = abi.encodePacked(hexValue, hexResult);
            decimalValue = decimalValue / 16;
        }
        
        // Account for missing leading zeros
        uint len = hexResult.length;

        if (len == 5) {
            hexResult = abi.encodePacked("0", hexResult);
        } else if (len == 4) {
            hexResult = abi.encodePacked("00", hexResult);
        } else if (len == 3) {
            hexResult = abi.encodePacked("000", hexResult);
        } else if (len == 4) {
            hexResult = abi.encodePacked("0000", hexResult);
        }

        return hexResult;
    }

    /**
     * Inspired by Guffa's math - https://stackoverflow.com/questions/29241442/decimal-to-rgb-in-javascript-and-php/29241510#29241510
     * Returns a value between 0 and 255 for red
     */
    function uintToRGBRed (uint256 decimalValue) pure public returns (uint16) {
        uint red = uint(decimalValue)/(256 * 256);
        return uint16(red);
    }

    /**
     * Inspired by Guffa's math - https://stackoverflow.com/questions/29241442/decimal-to-rgb-in-javascript-and-php/29241510#29241510
     * Returns a value between 0 and 255 for green
     */
    function uintToRGBGreen (uint256 decimalValue) pure public returns (uint16) {
        uint green = uint(decimalValue)/256;
        return uint16(green % 256);
    }

    /**
     * Inspired by Guffa's math - https://stackoverflow.com/questions/29241442/decimal-to-rgb-in-javascript-and-php/29241510#29241510
     * Returns a value between 0 and 255 for blue
     */
    function uintToRGBBlue (uint256 decimalValue) pure public returns (uint16) {
        return uint16(decimalValue % 256);
    }

        function convertHexColorToRGB(string memory _hexColor) public pure returns (uint16[] memory) {
        uint decimal = hexToUint(removeHashFromHexValue(_hexColor));
        uint16[] memory rgb = new uint16[](3);
        rgb[0] = uintToRGBRed(decimal);
        rgb[1] = uintToRGBGreen(decimal);
        rgb[2] = uintToRGBBlue(decimal);
        return rgb;
    }

    function convertRgbToHsl(uint16[] memory rgb) public pure returns (uint[] memory) {
        require(rgb.length == 3);
        uint[] memory hsl = new uint[](3);

        // Make r, g, and b fractions of 1
        int rFraction = divide(int(uint(rgb[0])), 255);
        int gFraction = divide(int(uint(rgb[1])), 255);
        int bFraction = divide(int(uint(rgb[2])), 255);

        // Find greatest and smallest channel values
        int[3] memory fractionArray = [rFraction, gFraction, bFraction];
        int channelMin = getMinValueOfArray(fractionArray);
        int channelMax = getMaxValueOfArray(fractionArray);
        int delta = channelMax - channelMin;

        // Calculate hue
        
        hsl[0] = formatHue(uint(calculateHue(rFraction, gFraction, bFraction, channelMax, delta)));

        // Calculate lightness

        int lightness = calculateLightness(channelMax, channelMin);
        hsl[2] = formatPercentage(uint(lightness));

        // Calculate saturation

        hsl[1] = formatPercentage(uint(calculateSaturation(delta, lightness)));

        return hsl;
    }

    function calculateHue(
        int rFraction,
        int gFraction,
        int bFraction,
        int channelMax,
        int delta
        ) internal pure returns (int) {
        int h;

        if (delta == 0) {
            h = 0;
        // Red is max
        } else if (channelMax == rFraction) {
            h = divide((int(gFraction) - int(bFraction)), delta) % 600000; // % 6
        // Green is max
        } else if (channelMax == gFraction) {
            h = divide(int(bFraction) - int(rFraction), delta) + 200000 ; // + 2
        // Blue is max
        } else {
            h = divide((rFraction - gFraction), delta) + 400000; // + 4
        }

        h *= 60;

        // Make negative hues positive behind 360°
        if (h < 0) {
            h += 36000000;
        }

        return h;
    }

    function calculateLightness(int channelMax, int channelMin) internal pure returns (int) {
        return divide((channelMax + channelMin), 200000);
    }

    function calculateSaturation(int delta, int lightness) internal pure returns (int) {
        int saturationDenomenator = 2 * lightness - 100000;
        // Get absolute value of saturationDenomenator
        if (saturationDenomenator < 0) {
            saturationDenomenator -= saturationDenomenator * 2;
        }
        
        return delta == 0 ? int(0) : divide(delta, 100000 - saturationDenomenator);
    }

    function formatPercentage(uint rawNum) internal pure returns (uint) {
        // Math has been done with 5 digits of precision, meaning the number "1" is represented
        // as 100000. 45%, or 0.45 is represented as 45000
        uint roundedDown = SafeMath.div(rawNum, 1000);
        // return int(roundedDown);
        uint decimals = SafeMath.sub(rawNum, roundedDown * 1000);
        if (decimals >= 445) {
            roundedDown += 1;
        }

        return roundedDown;
    }

    function formatHue(uint rawNum) internal pure returns (uint) {
        // Math has been done with 5 digits of precision, meaning the number "1" is represented
        // as 100000. 45%, or 0.45 is represented as 45000
        uint roundedDown = SafeMath.div(rawNum, 100000);
        uint decimals = SafeMath.sub(rawNum, roundedDown * 100000);
        if (decimals >= 44500) {
            roundedDown += 1;
        }

        return roundedDown;
    }

    // int allows for negative number division
    function divide(int numerator, int denominator) public pure returns(int quotient) {
        // Multiply by 1000000 for 5 decimals of precision
        int _numerator  = numerator * 1000000;
        // with rounding of last digit
        int _quotient =  ((_numerator / denominator) + 5) / 10;
        return ( _quotient);
    }

    function getMinValueOfArray(int[3] memory array) public pure returns (int) {
        int smallestValue = array[0];

        for (uint i = 0; i < array.length - 1; i++) {
            if (smallestValue > array[i + 1]) {
                smallestValue = array[i + 1];
            } 
        }
        return smallestValue;
    }

    function getMaxValueOfArray(int[3] memory array) public pure returns (int) {
        int largestValue = array[0];

        for (uint i = 0; i < array.length - 1; i++) {
            if (largestValue < array[i + 1]) {
                largestValue = array[i + 1];
            } 
        }
        return largestValue;
    }

    function removeHashFromHexValue(string memory _hex) public pure returns (string memory) {
        bytes memory _bytesHex = bytes(_hex);
        require(_bytesHex.length == 7, "Length not correct");
        require(_bytesHex[0] == "#", "Color code does not begin with '#'");
        return string(abi.encodePacked(_bytesHex[1], _bytesHex[2], _bytesHex[3], _bytesHex[4], _bytesHex[5], _bytesHex[6]));
    }
}