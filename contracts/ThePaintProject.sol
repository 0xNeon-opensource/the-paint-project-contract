// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "base64-sol/base64.sol";
import "./ColorConverter.sol";

contract ThePaintProject is ERC721URIStorage {

    string[] public colors;
    uint16 maxSupply = 1024;

    mapping(string => bool) _colorExists;
    mapping(uint => string) tokenIdToColor;
    mapping(uint => address) tokenIdToOwner;

    event CreatedColor(uint256 indexed tokenId, string tokenUri);

    modifier doesNotExceedMaxSupply() {
        require(colors.length + 1 <= 1024);
        _;
    }

    modifier onlyHexColor(bytes memory _color) {
        require(_color.length == 7, "Length not correct");
        require(_color[0] == "#", "Color code does not begin with '#'");
        for (uint8 i = 1; i < 7; i++) {
            require(
                _color[i] == 0x30 || // 0
                _color[i] == 0x31 || // 1
                _color[i] == 0x32 || // 2
                _color[i] == 0x33 || // 3
                _color[i] == 0x34 || // 4
                _color[i] == 0x35 || // 5
                _color[i] == 0x36 || // 6
                _color[i] == 0x37 || // 7
                _color[i] == 0x38 || // 8
                _color[i] == 0x39 || // 9
                _color[i] == 0x41 || // A
                _color[i] == 0x42 || // B
                _color[i] == 0x43 || // C
                _color[i] == 0x44 || // D
                _color[i] == 0x45 || // E
                _color[i] == 0x46,   // F
                "Color code is not a hex value"
            );
        }
        _;
    }
    
    constructor() ERC721("ThePaintProject", "PAINT") {
    }

    // Make this bytes32 or smaller??
    function mint(string  memory _color) external doesNotExceedMaxSupply() onlyHexColor(bytes(_color)) {
        require(!_colorExists[_color], 'Color exists');
        uint _id = colors.length;
        _safeMint(msg.sender, _id);
        colors.push(_color);
        _colorExists[_color] = true; // maybe remove and use tokenIdToColor?
        tokenIdToColor[_id] = _color;
        tokenIdToOwner[_id] = msg.sender;
        string memory tokenUri = getTokenUriForColor(_color);
        _setTokenURI(_id, tokenUri);
        emit CreatedColor(_id, tokenUri);
    }

    function totalSupply() public view returns (uint) {
        return colors.length;
    }

    function getColorsOfOwner(address _owner) external view returns (string[] memory) {
        uint256 tokenCount = balanceOf(_owner);
        
        if (tokenCount == 0) {
            // Return an empty array
            return new string[](0);
        } else {
            string[] memory result = new string[](tokenCount);
            uint256 totalColors = totalSupply();
            uint256 resultIndex = 0;

            // We count on the fact that all colors have IDs starting at 0 and increasing
            // sequentially up to but not including the totalColor count.
            uint256 tokenId;

            for (tokenId = 0; tokenId < totalColors; tokenId++) {
                if (tokenIdToOwner[tokenId] == _owner) {
                    result[resultIndex] = tokenIdToColor[tokenId];
                    resultIndex++;
                }
            }

            return result;
        }

    }

    function getTokenUriForColor(string memory _color) public pure returns (string memory) {
        string memory _imageUri = colorToImageUri(_color);
        string memory tokenUri = formatTokenUri(_color, _imageUri);
        return tokenUri;
    }

    function colorToImageUri(string memory _color) public pure returns (string memory) {
        // <svg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'><rect width='100%' height='100%' fill='lime' /></svg>
        // data:image/svg+xml;base64,<Base64-encoding)
        string memory baseUrl = "data:image/svg+xml;base64,";
        string memory baseSvg = "<svg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'><rect width='100%' height='100%' fill='";
        string memory svg =  string(abi.encodePacked(baseSvg, _color, "' /></svg>"));
        string memory svgBase64Encoded = Base64.encode(bytes(string(abi.encodePacked(svg))));
        string memory imageUri = string(abi.encodePacked(baseUrl, svgBase64Encoded));
        return imageUri;
    }

    function formatTokenUri(string memory _color, string memory _imageUri) public pure returns (string memory) {
        string memory baseUri = "data:application/json;base64,";
        string memory json = string(abi.encodePacked(
            '{',
                '"name": "', _color, 
                '", "description": "Proof of ownership of the original color ',
                _color, ' on the Ethereum blockchain.',
                '", "image": "', _imageUri, '"',
            '}'
        ));
        string memory encodedJson = Base64.encode(bytes(json));
        string memory tokenUri = string(abi.encodePacked(baseUri, encodedJson));
        return tokenUri;
    }

    function convertHexColorToRGB(string memory _hexColor) public pure returns (uint16[] memory) {
        uint decimal = ColorConverter.hexToUint(removeHashFromHexValue(_hexColor));
        uint16[] memory rgb = new uint16[](3);
        rgb[0] = ColorConverter.uintToRGBRed(decimal);
        rgb[1] = ColorConverter.uintToRGBGreen(decimal);
        rgb[2] = ColorConverter.uintToRGBBlue(decimal);
        return rgb;
    }

    function convertRgbToHsl(int16[] memory rgb) public pure returns (int[] memory) {
        require(rgb.length == 3);
        int[] memory hsl = new int[](3);

        // Make r, g, and b fractions of 1
        int rFraction = divide(int(rgb[0]), 255);
        int gFraction = divide(int(rgb[1]), 255);
        int bFraction = divide(int(rgb[2]), 255);

        // Find greatest and smallest channel values
        int[3] memory fractionArray = [rFraction, gFraction, bFraction];
        int channelMin = getMinValueOfArray(fractionArray);
        int channelMax = getMaxValueOfArray(fractionArray);
        int delta = channelMax - channelMin;

        // Calculate hue
        
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

        // Calculate luminance

        int l;

        l = divide((channelMax + channelMin), 200000);

        // Calculate saturation

        int s;

        int saturationDenomenator = 2 * l - 100000;
        // Get absolute value of saturationDenomenator
        if (saturationDenomenator < 0) {
            saturationDenomenator -= saturationDenomenator * 2;
        }
        s = delta == 0 ? int(0) : divide(delta, 100000 - saturationDenomenator);

        hsl[0] = h;
        hsl[1] = s;
        hsl[2] = l;

        return hsl;
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