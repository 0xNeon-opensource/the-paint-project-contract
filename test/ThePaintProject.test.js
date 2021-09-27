const ThePaintProject = artifacts.require('./ThePaintProject.sol')

require('chai')
    .use(require('chai-as-promised'))
    .should()

contract('ThePaintProject', (accounts) => {
    let contract;

    beforeEach(async () => {
        contract = await ThePaintProject.deployed();
    });

    describe('deployment', async () => {
        it('deploys successfully', async () => {
            const address = contract.address;
            expect(address).to.not.eql(0x0);
            expect(address).to.not.be.empty;
            expect(address).to.not.be.null;
            expect(address).to.not.be.undefined;
        })

        it('has a name', async () => {
            const name = await contract.name();
            expect(name).to.eql('ThePaintProject');
        });

        it('has a symbol', async () => {
            const symbol = await contract.symbol();
            expect(symbol).to.eql('PAINT');
        });
    })

    describe('minting', async () => {

        it('creates a new token successfully', async () => {
            const colorValue = '#FFFFFF';
            const result = await contract.mint(colorValue);
            const totalSupply = await contract.totalSupply();
            const event = result.logs[0].args

            // Success
            assert.equal(totalSupply, 1);
            assert.equal(event.tokenId.toNumber(), 0, 'id is correct');
            assert.equal(event.from, 0x0000000000000000000000000000000000000000, '`from` is correct');
            assert.equal(event.to, accounts[0], '`to` is correct');

            // Failure: fails when minting the same color twice
            await contract.mint(colorValue).should.be.rejected;
        });

    });

    describe('indexing', async () => {
        it('lists colors', async () => {
            // including color previously minted
            let expectedColors = ['#FFFFFF', '#150050', '#000000', '#4A0E4E'];
            // Mint 3 MORE tokens
            await contract.mint(expectedColors[1]);
            await contract.mint(expectedColors[2]);
            await contract.mint(expectedColors[3]);
            const totalSupply = await contract.totalSupply();

            let result = []

            for (let i = 0; i < totalSupply; i++) {
                let color = await contract.colors(i);
                result.push(color);
            }

            assert.equal(result[0], '#FFFFFF'); // from first minting test
            assert.equal(result[1], expectedColors[1]);
            assert.equal(result[2], expectedColors[2]);
            assert.equal(result[3], expectedColors[3]);
        });
    });

    describe('mint modifier', async () => {
        it('cannot mint something that is not a hex color', async () => {
            await contract.mint('').should.be.rejected;

            // Too short
            await contract.mint('#FFF').should.be.rejected;

            // Too long
            await contract.mint('#FFFFFFF').should.be.rejected;

            // no #, correct length
            await contract.mint('FFFFFFF').should.be.rejected;

            // color should be hex
            await contract.mint('#ZZZZZZ').should.be.rejected;

        });
    });

    describe('metadata', async () => {
        // These tests are very brittle
        // #150050 is the second color minted
        const mintedColor = '#150050';
        const expectedImageUriForMintedColor = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMTAwJScgaGVpZ2h0PScxMDAlJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxyZWN0IHdpZHRoPScxMDAlJyBoZWlnaHQ9JzEwMCUnIGZpbGw9JyMxNTAwNTAnIC8+PC9zdmc+';
        const expectedTokenUri = 'data:application/json;base64,eyJuYW1lIjogIiMxNTAwNTAiLCAiZGVzY3JpcHRpb24iOiAiUHJvb2Ygb2Ygb3duZXJzaGlwIG9mIHRoZSBvcmlnaW5hbCBjb2xvciAjMTUwMDUwIG9uIHRoZSBFdGhlcmV1bSBibG9ja2NoYWluLiIsICJpbWFnZSI6ICJkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBITjJaeUIzYVdSMGFEMG5NVEF3SlNjZ2FHVnBaMmgwUFNjeE1EQWxKeUI0Yld4dWN6MG5hSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY25Qanh5WldOMElIZHBaSFJvUFNjeE1EQWxKeUJvWldsbmFIUTlKekV3TUNVbklHWnBiR3c5SnlNeE5UQXdOVEFuSUM4K1BDOXpkbWMrIn0=';
        it('should convert a hex color into an svg image URI', async () => {
            const uri = await contract.colorToImageUri(mintedColor);
            assert.equal(uri, expectedImageUriForMintedColor);
        });

        it('should format token URI', async () => {
            const tokenUri = await contract.formatTokenUri(mintedColor, expectedImageUriForMintedColor);
            assert.equal(tokenUri, expectedTokenUri);
        });

        it('should get metadata from color', async () => {
            const metadata = await contract.getTokenUriForColor(mintedColor);
            assert.equal(metadata, expectedTokenUri);
        });
    });

    describe('tokenToOwner', async () => {
        it('should get tokens for a given owner', async () => {
            const account2Colors = await contract.getColorsOfOwner(accounts[1]);
            expect(account2Colors).to.be.empty;

            // All previously minted colors
            let expectedColors = ['#FFFFFF', '#150050', '#000000', '#4A0E4E'];
            const account1Colors = await contract.getColorsOfOwner(accounts[0]);
            assert.deepEqual(account1Colors, expectedColors);
        });
    });

    describe('color conversion', async() => {

        it('should remove # from hex color', async() => {
            const colorValue = "#32502E";
            const expected = "32502E";

            const result = await contract.removeHashFromHexValue(colorValue);

            assert.equal(result, expected);
        });

        it('should convert hex to RGB', async() => {
            const colorValue = "#32502E";
            const expectedRGB = [50, 80, 46];
            const expectedR = 50;
            const expectedG = 80;
            const expectedB = 46;

            await contract.convertHexColorToRGB(colorValue).then((result) => {
                assert.equal(result[0].toNumber(), expectedR);
                assert.equal(result[1].toNumber(), expectedG);
                assert.equal(result[2].toNumber(), expectedB);
            });
        });

        it('should convert RGB to HSL', async() => {
            const rgb = [160, 80, 70];

            await contract.convertRgbToHsl(rgb).then((result) => {
                // Hue
                assert.equal(result[0].toNumber(), 7);
                // Saturation
                assert.equal(result[1].toNumber(), 39);
                // Lightness
                assert.equal(result[2].toNumber(), 45);
            });
        });
    });

    describe('helper math functions', async() => {
        it('should find the min value in an array of three numbers', async() => {
            const arrayMinOne = [1, 2, 3];

            await contract.getMinValueOfArray(arrayMinOne).then((result) => {
                assert.equal(result.toNumber(), 1);
            });

            const arrayMinTwo = [5, 2, 4];

            await contract.getMinValueOfArray(arrayMinTwo).then((result) => {
                assert.equal(result.toNumber(), 2);
            });

            const arrayMinZero = [5, 2, 0];

            await contract.getMinValueOfArray(arrayMinZero).then((result) => {
                assert.equal(result.toNumber(), 0);
            });

            const arrayMinThree = [3, 5, 4];

            await contract.getMinValueOfArray(arrayMinThree).then((result) => {
                assert.equal(result.toNumber(), 3);
            });
        });

        it('should find the max value in an array of three numbers', async() => {
            const arrayMaxThree = [1, 3, 2];

            await contract.getMaxValueOfArray(arrayMaxThree).then((result) => {
                assert.equal(result.toNumber(), 3);
            });

            const arrayMaxFive = [5, 2, 4];

            await contract.getMaxValueOfArray(arrayMaxFive).then((result) => {
                assert.equal(result.toNumber(), 5);
            });

            const arrayMaxTen = [5, 2, 10];

            await contract.getMaxValueOfArray(arrayMaxTen).then((result) => {
                assert.equal(result.toNumber(), 10);
            });
        });

        it('should divide two numbers the hacky solidity way (keeping the number of digits, in this case 5)', async() => {
            const num1 = 3;
            const den1 = 2;

            await contract.divide(num1, den1).then((result) => {
                // Move the decimal place over 5 (our precision number of digits) to get 1.5
                assert.equal(result.toNumber(), 150000);
            });

            const num2 = 50;
            const den2 = 255;

            await contract.divide(num2, den2).then((result) => {
                assert.equal(result.toNumber(), 19608);
            });

            const num3 = 80;
            const den3 = 255;

            await contract.divide(num3, den3).then((result) => {
                assert.equal(result.toNumber(), 31373);
            });

            const num4 = 46;
            const den4 = 255;

            await contract.divide(num4, den4).then((result) => {
                assert.equal(result.toNumber(), 18039);
            });

            const num5 = 255;
            const den5 = 255;

            await contract.divide(num5, den5).then((result) => {
                assert.equal(result.toNumber(), 100000);
            });
        });
    });
})

const listOf1024Colors = ["#101112", "#101113", "#101114", "#101115", "#101116", "#101117", "#101118", "#101119", "#10111A", "#10111B", "#10111C", "#10111D", "#10111E", "#10111F", "#101120", "#101121", "#101122", "#101123", "#101213", "#101214", "#101215", "#101216", "#101217", "#101218", "#101219", "#10121A", "#10121B", "#10121C", "#10121D", "#10121E", "#10121F", "#101220", "#101221", "#101222", "#101223", "#101314", "#101315", "#101316", "#101317", "#101318", "#101319", "#10131A", "#10131B", "#10131C", "#10131D", "#10131E", "#10131F", "#101320", "#101321", "#101322", "#101323", "#101415", "#101416", "#101417", "#101418", "#101419", "#10141A", "#10141B", "#10141C", "#10141D", "#10141E", "#10141F", "#101420", "#101421", "#101422", "#101423", "#101516", "#101517", "#101518", "#101519", "#10151A", "#10151B", "#10151C", "#10151D", "#10151E", "#10151F", "#101520", "#101521", "#101522", "#101523", "#101617", "#101618", "#101619", "#10161A", "#10161B", "#10161C", "#10161D", "#10161E", "#10161F", "#101620", "#101621", "#101622", "#101623", "#101718", "#101719", "#10171A", "#10171B", "#10171C", "#10171D", "#10171E", "#10171F", "#101720", "#101721", "#101722", "#101723", "#101819", "#10181A", "#10181B", "#10181C", "#10181D", "#10181E", "#10181F", "#101820", "#101821", "#101822", "#101823", "#10191A", "#10191B", "#10191C", "#10191D", "#10191E", "#10191F", "#101920", "#101921", "#101922", "#101923", "#101A1B", "#101A1C", "#101A1D", "#101A1E", "#101A1F", "#101A20", "#101A21", "#101A22", "#101A23", "#101B1C", "#101B1D", "#101B1E", "#101B1F", "#101B20", "#101B21", "#101B22", "#101B23", "#101C1D", "#101C1E", "#101C1F", "#101C20", "#101C21", "#101C22", "#101C23", "#101D1E", "#101D1F", "#101D20", "#101D21", "#101D22", "#101D23", "#101E1F", "#101E20", "#101E21", "#101E22", "#101E23", "#101F20", "#101F21", "#101F22", "#101F23", "#102021", "#102022", "#102023", "#102122", "#102123", "#102223", "#111213", "#111214", "#111215", "#111216", "#111217", "#111218", "#111219", "#11121A", "#11121B", "#11121C", "#11121D", "#11121E", "#11121F", "#111220", "#111221", "#111222", "#111223", "#111314", "#111315", "#111316", "#111317", "#111318", "#111319", "#11131A", "#11131B", "#11131C", "#11131D", "#11131E", "#11131F", "#111320", "#111321", "#111322", "#111323", "#111415", "#111416", "#111417", "#111418", "#111419", "#11141A", "#11141B", "#11141C", "#11141D", "#11141E", "#11141F", "#111420", "#111421", "#111422", "#111423", "#111516", "#111517", "#111518", "#111519", "#11151A", "#11151B", "#11151C", "#11151D", "#11151E", "#11151F", "#111520", "#111521", "#111522", "#111523", "#111617", "#111618", "#111619", "#11161A", "#11161B", "#11161C", "#11161D", "#11161E", "#11161F", "#111620", "#111621", "#111622", "#111623", "#111718", "#111719", "#11171A", "#11171B", "#11171C", "#11171D", "#11171E", "#11171F", "#111720", "#111721", "#111722", "#111723", "#111819", "#11181A", "#11181B", "#11181C", "#11181D", "#11181E", "#11181F", "#111820", "#111821", "#111822", "#111823", "#11191A", "#11191B", "#11191C", "#11191D", "#11191E", "#11191F", "#111920", "#111921", "#111922", "#111923", "#111A1B", "#111A1C", "#111A1D", "#111A1E", "#111A1F", "#111A20", "#111A21", "#111A22", "#111A23", "#111B1C", "#111B1D", "#111B1E", "#111B1F", "#111B20", "#111B21", "#111B22", "#111B23", "#111C1D", "#111C1E", "#111C1F", "#111C20", "#111C21", "#111C22", "#111C23", "#111D1E", "#111D1F", "#111D20", "#111D21", "#111D22", "#111D23", "#111E1F", "#111E20", "#111E21", "#111E22", "#111E23", "#111F20", "#111F21", "#111F22", "#111F23", "#112021", "#112022", "#112023", "#112122", "#112123", "#112223", "#121314", "#121315", "#121316", "#121317", "#121318", "#121319", "#12131A", "#12131B", "#12131C", "#12131D", "#12131E", "#12131F", "#121320", "#121321", "#121322", "#121323", "#121415", "#121416", "#121417", "#121418", "#121419", "#12141A", "#12141B", "#12141C", "#12141D", "#12141E", "#12141F", "#121420", "#121421", "#121422", "#121423", "#121516", "#121517", "#121518", "#121519", "#12151A", "#12151B", "#12151C", "#12151D", "#12151E", "#12151F", "#121520", "#121521", "#121522", "#121523", "#121617", "#121618", "#121619", "#12161A", "#12161B", "#12161C", "#12161D", "#12161E", "#12161F", "#121620", "#121621", "#121622", "#121623", "#121718", "#121719", "#12171A", "#12171B", "#12171C", "#12171D", "#12171E", "#12171F", "#121720", "#121721", "#121722", "#121723", "#121819", "#12181A", "#12181B", "#12181C", "#12181D", "#12181E", "#12181F", "#121820", "#121821", "#121822", "#121823", "#12191A", "#12191B", "#12191C", "#12191D", "#12191E", "#12191F", "#121920", "#121921", "#121922", "#121923", "#121A1B", "#121A1C", "#121A1D", "#121A1E", "#121A1F", "#121A20", "#121A21", "#121A22", "#121A23", "#121B1C", "#121B1D", "#121B1E", "#121B1F", "#121B20", "#121B21", "#121B22", "#121B23", "#121C1D", "#121C1E", "#121C1F", "#121C20", "#121C21", "#121C22", "#121C23", "#121D1E", "#121D1F", "#121D20", "#121D21", "#121D22", "#121D23", "#121E1F", "#121E20", "#121E21", "#121E22", "#121E23", "#121F20", "#121F21", "#121F22", "#121F23", "#122021", "#122022", "#122023", "#122122", "#122123", "#122223", "#131415", "#131416", "#131417", "#131418", "#131419", "#13141A", "#13141B", "#13141C", "#13141D", "#13141E", "#13141F", "#131420", "#131421", "#131422", "#131423", "#131516", "#131517", "#131518", "#131519", "#13151A", "#13151B", "#13151C", "#13151D", "#13151E", "#13151F", "#131520", "#131521", "#131522", "#131523", "#131617", "#131618", "#131619", "#13161A", "#13161B", "#13161C", "#13161D", "#13161E", "#13161F", "#131620", "#131621", "#131622", "#131623", "#131718", "#131719", "#13171A", "#13171B", "#13171C", "#13171D", "#13171E", "#13171F", "#131720", "#131721", "#131722", "#131723", "#131819", "#13181A", "#13181B", "#13181C", "#13181D", "#13181E", "#13181F", "#131820", "#131821", "#131822", "#131823", "#13191A", "#13191B", "#13191C", "#13191D", "#13191E", "#13191F", "#131920", "#131921", "#131922", "#131923", "#131A1B", "#131A1C", "#131A1D", "#131A1E", "#131A1F", "#131A20", "#131A21", "#131A22", "#131A23", "#131B1C", "#131B1D", "#131B1E", "#131B1F", "#131B20", "#131B21", "#131B22", "#131B23", "#131C1D", "#131C1E", "#131C1F", "#131C20", "#131C21", "#131C22", "#131C23", "#131D1E", "#131D1F", "#131D20", "#131D21", "#131D22", "#131D23", "#131E1F", "#131E20", "#131E21", "#131E22", "#131E23", "#131F20", "#131F21", "#131F22", "#131F23", "#132021", "#132022", "#132023", "#132122", "#132123", "#132223", "#141516", "#141517", "#141518", "#141519", "#14151A", "#14151B", "#14151C", "#14151D", "#14151E", "#14151F", "#141520", "#141521", "#141522", "#141523", "#141617", "#141618", "#141619", "#14161A", "#14161B", "#14161C", "#14161D", "#14161E", "#14161F", "#141620", "#141621", "#141622", "#141623", "#141718", "#141719", "#14171A", "#14171B", "#14171C", "#14171D", "#14171E", "#14171F", "#141720", "#141721", "#141722", "#141723", "#141819", "#14181A", "#14181B", "#14181C", "#14181D", "#14181E", "#14181F", "#141820", "#141821", "#141822", "#141823", "#14191A", "#14191B", "#14191C", "#14191D", "#14191E", "#14191F", "#141920", "#141921", "#141922", "#141923", "#141A1B", "#141A1C", "#141A1D", "#141A1E", "#141A1F", "#141A20", "#141A21", "#141A22", "#141A23", "#141B1C", "#141B1D", "#141B1E", "#141B1F", "#141B20", "#141B21", "#141B22", "#141B23", "#141C1D", "#141C1E", "#141C1F", "#141C20", "#141C21", "#141C22", "#141C23", "#141D1E", "#141D1F", "#141D20", "#141D21", "#141D22", "#141D23", "#141E1F", "#141E20", "#141E21", "#141E22", "#141E23", "#141F20", "#141F21", "#141F22", "#141F23", "#142021", "#142022", "#142023", "#142122", "#142123", "#142223", "#151617", "#151618", "#151619", "#15161A", "#15161B", "#15161C", "#15161D", "#15161E", "#15161F", "#151620", "#151621", "#151622", "#151623", "#151718", "#151719", "#15171A", "#15171B", "#15171C", "#15171D", "#15171E", "#15171F", "#151720", "#151721", "#151722", "#151723", "#151819", "#15181A", "#15181B", "#15181C", "#15181D", "#15181E", "#15181F", "#151820", "#151821", "#151822", "#151823", "#15191A", "#15191B", "#15191C", "#15191D", "#15191E", "#15191F", "#151920", "#151921", "#151922", "#151923", "#151A1B", "#151A1C", "#151A1D", "#151A1E", "#151A1F", "#151A20", "#151A21", "#151A22", "#151A23", "#151B1C", "#151B1D", "#151B1E", "#151B1F", "#151B20", "#151B21", "#151B22", "#151B23", "#151C1D", "#151C1E", "#151C1F", "#151C20", "#151C21", "#151C22", "#151C23", "#151D1E", "#151D1F", "#151D20", "#151D21", "#151D22", "#151D23", "#151E1F", "#151E20", "#151E21", "#151E22", "#151E23", "#151F20", "#151F21", "#151F22", "#151F23", "#152021", "#152022", "#152023", "#152122", "#152123", "#152223", "#161718", "#161719", "#16171A", "#16171B", "#16171C", "#16171D", "#16171E", "#16171F", "#161720", "#161721", "#161722", "#161723", "#161819", "#16181A", "#16181B", "#16181C", "#16181D", "#16181E", "#16181F", "#161820", "#161821", "#161822", "#161823", "#16191A", "#16191B", "#16191C", "#16191D", "#16191E", "#16191F", "#161920", "#161921", "#161922", "#161923", "#161A1B", "#161A1C", "#161A1D", "#161A1E", "#161A1F", "#161A20", "#161A21", "#161A22", "#161A23", "#161B1C", "#161B1D", "#161B1E", "#161B1F", "#161B20", "#161B21", "#161B22", "#161B23", "#161C1D", "#161C1E", "#161C1F", "#161C20", "#161C21", "#161C22", "#161C23", "#161D1E", "#161D1F", "#161D20", "#161D21", "#161D22", "#161D23", "#161E1F", "#161E20", "#161E21", "#161E22", "#161E23", "#161F20", "#161F21", "#161F22", "#161F23", "#162021", "#162022", "#162023", "#162122", "#162123", "#162223", "#171819", "#17181A", "#17181B", "#17181C", "#17181D", "#17181E", "#17181F", "#171820", "#171821", "#171822", "#171823", "#17191A", "#17191B", "#17191C", "#17191D", "#17191E", "#17191F", "#171920", "#171921", "#171922", "#171923", "#171A1B", "#171A1C", "#171A1D", "#171A1E", "#171A1F", "#171A20", "#171A21", "#171A22", "#171A23", "#171B1C", "#171B1D", "#171B1E", "#171B1F", "#171B20", "#171B21", "#171B22", "#171B23", "#171C1D", "#171C1E", "#171C1F", "#171C20", "#171C21", "#171C22", "#171C23", "#171D1E", "#171D1F", "#171D20", "#171D21", "#171D22", "#171D23", "#171E1F", "#171E20", "#171E21", "#171E22", "#171E23", "#171F20", "#171F21", "#171F22", "#171F23", "#172021", "#172022", "#172023", "#172122", "#172123", "#172223", "#18191A", "#18191B", "#18191C", "#18191D", "#18191E", "#18191F", "#181920", "#181921", "#181922", "#181923", "#181A1B", "#181A1C", "#181A1D", "#181A1E", "#181A1F", "#181A20", "#181A21", "#181A22", "#181A23", "#181B1C", "#181B1D", "#181B1E", "#181B1F", "#181B20", "#181B21", "#181B22", "#181B23", "#181C1D", "#181C1E", "#181C1F", "#181C20", "#181C21", "#181C22", "#181C23", "#181D1E", "#181D1F", "#181D20", "#181D21", "#181D22", "#181D23", "#181E1F", "#181E20", "#181E21", "#181E22", "#181E23", "#181F20", "#181F21", "#181F22", "#181F23", "#182021", "#182022", "#182023", "#182122", "#182123", "#182223", "#191A1B", "#191A1C", "#191A1D", "#191A1E", "#191A1F", "#191A20", "#191A21", "#191A22", "#191A23", "#191B1C", "#191B1D", "#191B1E", "#191B1F", "#191B20", "#191B21", "#191B22", "#191B23", "#191C1D", "#191C1E", "#191C1F", "#191C20", "#191C21", "#191C22", "#191C23", "#191D1E", "#191D1F", "#191D20", "#191D21", "#191D22", "#191D23", "#191E1F", "#191E20", "#191E21", "#191E22", "#191E23", "#191F20", "#191F21", "#191F22", "#191F23", "#192021", "#192022", "#192023", "#192122", "#192123", "#192223", "#1A1B1C", "#1A1B1D", "#1A1B1E", "#1A1B1F"]

const lastColor = "1a1b20"
contract('ThePaintProject Max Supply', (accounts) => {
    let contract;

    beforeEach(async () => {
        contract = await ThePaintProject.deployed();
    });

    // remove x when testing this describe.
    xdescribe('minting to and after max supply', async () => {

        it('mints 1024 colors', async () => {
            for (const color of listOf1024Colors) {
                console.log(`MINTING COLOR`, color)
                await contract.mint(color);
            }

            const totalSupply = await contract.totalSupply();

            // Success
            assert.equal(totalSupply, 1024);

            // Failure: fails when minting more than max supply
            await contract.mint(lastColor).should.be.rejected;
        });

    });

});

