const ColorConverter = artifacts.require('./ColorConverter.sol')

require('chai')
    .use(require('chai-as-promised'))
    .should()

contract('ColorConverter', (accounts) => {
    let library;

    beforeEach(async () => {
        library = await ColorConverter.deployed();
    });

    describe('deployment', async () => {
        it('deploys successfully', async () => {
            const address = library.address;
            expect(address).to.not.eql(0x0);
            expect(address).to.not.be.empty;
            expect(address).to.not.be.null;
            expect(address).to.not.be.undefined;
        })

    });

    describe('color conversion', async () => {

        it('should remove # from hex color', async () => {
            const colorValue = "#32502E";
            const expected = "32502E";

            const result = await library.removeHashFromHexValue(colorValue);

            assert.equal(result, expected);
        });

        it('should convert hex to RGB', async () => {
            const colorValue = "#32502E";
            const expectedRGB = [50, 80, 46];
            const expectedR = 50;
            const expectedG = 80;
            const expectedB = 46;

            await library.convertHexColorToRGB(colorValue).then((result) => {
                assert.equal(result[0].toNumber(), expectedR);
                assert.equal(result[1].toNumber(), expectedG);
                assert.equal(result[2].toNumber(), expectedB);
            });
        });

        it('should convert RGB to HSL', async () => {
            const rgb = [160, 80, 70];

            await library.convertRgbToHsl(rgb).then((result) => {
                // Hue
                assert.equal(result[0].toNumber(), 7);
                // Saturation
                assert.equal(result[1].toNumber(), 39);
                // Lightness
                assert.equal(result[2].toNumber(), 45);
            });
        });
    });

    describe('helper math functions', async () => {
        it('should find the min value in an array of three numbers', async () => {
            const arrayMinOne = [1, 2, 3];

            await library.getMinValueOfArray(arrayMinOne).then((result) => {
                assert.equal(result.toNumber(), 1);
            });

            const arrayMinTwo = [5, 2, 4];

            await library.getMinValueOfArray(arrayMinTwo).then((result) => {
                assert.equal(result.toNumber(), 2);
            });

            const arrayMinZero = [5, 2, 0];

            await library.getMinValueOfArray(arrayMinZero).then((result) => {
                assert.equal(result.toNumber(), 0);
            });

            const arrayMinThree = [3, 5, 4];

            await library.getMinValueOfArray(arrayMinThree).then((result) => {
                assert.equal(result.toNumber(), 3);
            });
        });

        it('should find the max value in an array of three numbers', async () => {
            const arrayMaxThree = [1, 3, 2];

            await library.getMaxValueOfArray(arrayMaxThree).then((result) => {
                assert.equal(result.toNumber(), 3);
            });

            const arrayMaxFive = [5, 2, 4];

            await library.getMaxValueOfArray(arrayMaxFive).then((result) => {
                assert.equal(result.toNumber(), 5);
            });

            const arrayMaxTen = [5, 2, 10];

            await library.getMaxValueOfArray(arrayMaxTen).then((result) => {
                assert.equal(result.toNumber(), 10);
            });
        });

        it('should divide two numbers the hacky solidity way (keeping the number of digits, in this case 5)', async () => {
            const num1 = 3;
            const den1 = 2;

            await library.divide(num1, den1).then((result) => {
                // Move the decimal place over 5 (our precision number of digits) to get 1.5
                assert.equal(result.toNumber(), 150000);
            });

            const num2 = 50;
            const den2 = 255;

            await library.divide(num2, den2).then((result) => {
                assert.equal(result.toNumber(), 19608);
            });

            const num3 = 80;
            const den3 = 255;

            await library.divide(num3, den3).then((result) => {
                assert.equal(result.toNumber(), 31373);
            });

            const num4 = 46;
            const den4 = 255;

            await library.divide(num4, den4).then((result) => {
                assert.equal(result.toNumber(), 18039);
            });

            const num5 = 255;
            const den5 = 255;

            await library.divide(num5, den5).then((result) => {
                assert.equal(result.toNumber(), 100000);
            });
        });
    });

});
