// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "base64-sol/base64.sol";
import "./ColorConverter.sol";

contract ThePaintProject is ERC721URIStorage {

    using SafeMath for uint;

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
        uint16[] memory rgb = ColorConverter.convertHexColorToRGB(_color);
        uint[] memory hsl = ColorConverter.convertRgbToHsl(rgb);
        string memory json = string(abi.encodePacked(
            '{',
                '"name": "', _color, 
                '", "description": "Proof of ownership of the original color ',
                _color, ' on the Ethereum blockchain.',
                '", "image": "', _imageUri, '"',
                ', "attributes": [',
                    '{"trait_type": "Red Intensity", ',
                    '"value": "', uintToString(uint(rgb[0])), '"}, ',
                    '{"trait_type": "Green Intensity", ',
                    '"value": "', uintToString(uint(rgb[1])), '"}, ',
                    '{"trait_type": "Blue Intensity", ',
                    '"value": "', uintToString(uint(rgb[2])), '"}, ',
                    '{"trait_type": "Hue", ',
                    '"value": "', uintToString(uint(hsl[0])), unicode"°", '"}, ',
                    '{"trait_type": "Saturation", ',
                    '"value": "', uintToString(uint(hsl[1])), '%"}, ',
                    '{"trait_type": "Lightness", ',
                    '"value": "', uintToString(uint(hsl[2])), '%"}',
                ']',
            '}'
        ));
        string memory encodedJson = Base64.encode(bytes(json));
        string memory tokenUri = string(abi.encodePacked(baseUri, encodedJson));
        return tokenUri;
    }

    function uintToString(uint256 _i)internal pure returns (string memory str) {
        if (_i == 0)
        {
            return "0";
        }
        uint256 j = _i;
        uint256 length;
        while (j != 0)
        {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        j = _i;
        while (j != 0)
        {
            bstr[--k] = bytes1(uint8(48 + j % 10));
            j /= 10;
        }
        return string(bstr);
    }
}