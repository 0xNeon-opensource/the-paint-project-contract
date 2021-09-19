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

    describe('tokenToOwner', async() => {
        it('should get tokens for a given owner', async() => {
            const account2Colors = await contract.getColorsOfOwner(accounts[1]);
            expect(account2Colors).to.be.empty;

            // All previously minted colors
            let expectedColors = ['#FFFFFF', '#150050', '#000000', '#4A0E4E'];
            const account1Colors = await contract.getColorsOfOwner(accounts[0]);
            assert.deepEqual(account1Colors, expectedColors);
        });
    });
})