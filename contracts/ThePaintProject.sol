// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "base64-sol/base64.sol";
import "./ColorConverter.sol";

/// @title The Paint Project
/// @author @0xNeon
/// @notice Creates and manages the first colors stored on the blockchain
contract ThePaintProject is ERC721URIStorage, Ownable {

    using SafeMath for uint;

    string[] public colors;
    uint16 maxSupply = 1024;

    mapping(string => bool) colorExists;
    mapping(uint => string) tokenIdToColor;
    mapping(uint => address) tokenIdToOwner;

    event CreatedColor(uint256 indexed tokenId, string tokenUri);

    modifier doesNotExceedMaxSupply() {
        require(colors.length + 1 <= 1024);
        _;
    }

    modifier onlyHexColor(bytes memory color) {
        require(color.length == 7, "Length not correct");
        require(color[0] == "#", "Color code does not begin with '#'");
        for (uint8 i = 1; i < 7; i++) {
            require(
                color[i] == 0x30 || // 0
                color[i] == 0x31 || // 1
                color[i] == 0x32 || // 2
                color[i] == 0x33 || // 3
                color[i] == 0x34 || // 4
                color[i] == 0x35 || // 5
                color[i] == 0x36 || // 6
                color[i] == 0x37 || // 7
                color[i] == 0x38 || // 8
                color[i] == 0x39 || // 9
                color[i] == 0x41 || // A
                color[i] == 0x42 || // B
                color[i] == 0x43 || // C
                color[i] == 0x44 || // D
                color[i] == 0x45 || // E
                color[i] == 0x46,   // F
                "Color code is not a hex value"
            );
        }
        _;
    }
    
    constructor() ERC721("ThePaintProject", "PAINT") {}

    function contractURI() public pure returns (string memory) {
        return '{"name": "The Paint Project", "description": "The first colors stored on the blockchain. Feel free to use a Paint in any way you want.", "image": "https://static.wikia.nocookie.net/logopedia/images/2/29/Microsoft_Paint_Logo_%281998-2001%29_%28Alternative%29.png/revision/latest/scale-to-width-down/640?cb=20200822232627", "external_link": "https://thepaintproject.xyz", "seller_fee_basis_points": 1000, "fee_recipient": "0xD389E5427D20E9a2d7add0F102adf8E8A897c202"}';
    }

    function mint(string  memory color) external doesNotExceedMaxSupply() onlyHexColor(bytes(color)) {
        require(!colorExists[color], 'Color exists');
        uint id = colors.length;
        _safeMint(msg.sender, id);
        colors.push(color);
        colorExists[color] = true;
        tokenIdToColor[id] = color;
        tokenIdToOwner[id] = msg.sender;
        string memory tokenUri = getTokenUriForColor(color);
        _setTokenURI(id, tokenUri);
        emit CreatedColor(id, tokenUri);
    }

    function getColorsOfOwner(address owner) external view returns (string[] memory) {
        uint256 tokenCount = balanceOf(owner);
        
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
                if (tokenIdToOwner[tokenId] == owner) {
                    result[resultIndex] = tokenIdToColor[tokenId];
                    resultIndex++;
                }
            }

            return result;
        }

    }

    function totalSupply() public view returns (uint) {
        return colors.length;
    }

    function getTokenUriForColor(string memory color) public pure returns (string memory) {
        string memory imageUri = colorToImageUri(color);
        string memory tokenUri = formatTokenUri(color, imageUri);
        return tokenUri;
    }

    function colorToImageUri(string memory color) public pure returns (string memory) {
        // <svg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'><rect width='100%' height='100%' fill='COLOR' /></svg>
        // data:image/svg+xml;base64,<Base64-encoding)
        string memory baseUrl = "data:image/svg+xml;base64,";
        string memory baseSvg = "<svg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'><rect width='100%' height='100%' fill='";
        string memory svg =  string(abi.encodePacked(baseSvg, color, "' /></svg>"));
        string memory svgBase64Encoded = Base64.encode(bytes(string(abi.encodePacked(svg))));
        string memory imageUri = string(abi.encodePacked(baseUrl, svgBase64Encoded));
        return imageUri;
    }

    function formatTokenUri(string memory color, string memory imageUri) private pure returns (string memory) {
        string memory baseUri = "data:application/json;base64,";
        uint16[] memory rgb = ColorConverter.convertHexColorToRGB(color);
        uint[] memory hsl = ColorConverter.convertRgbToHsl(rgb);
        string memory json = string(abi.encodePacked('{',
                '"name": "', color, 
                '", "description": "Proof of ownership of the original color ',
                color, ' on the Ethereum blockchain.',
                '", "image": "', imageUri, '"',
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
                    '"value": "', uintToString(uint(hsl[1])), ' percent"}, ',
                    '{"trait_type": "Lightness", ',
                    '"value": "', uintToString(uint(hsl[2])), ' percent"}',
                ']',
            '}'
        ));
        string memory encodedJson = Base64.encode(bytes(json));
        string memory tokenUri = string(abi.encodePacked(baseUri, encodedJson));
        return tokenUri;
    }

    function uintToString(uint256 i) private pure returns (string memory str) {
        if (i == 0)
        {
            return "0";
        }
        uint256 j = i;
        uint256 length;
        while (j != 0)
        {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        j = i;
        while (j != 0)
        {
            bstr[--k] = bytes1(uint8(48 + j % 10));
            j /= 10;
        }
        return string(bstr);
    }
}