const Web3 = require('web3');
const ERC20_ABI = require('./abi.json');
const ethereumMultiCall = require('ethereum-multicall');

/** Provider này chỉ hỗ trợ http */
const PROVIDER = 'https://rinkeby.infura.io/v3/5194fde9bf364940a1bbaffd59534e78';

/** Provider này hỗ trợ socket */
const PROVIDER_WSS = 'wss://rinkeby.infura.io/ws/v3/5194fde9bf364940a1bbaffd59534e78';

(async () => {
    //khởi tạo web3
    const web3 = new Web3(PROVIDER);
    /**
     * Lấy thông tin transaction
     */
    const ethBalance = await web3.eth.getBalance('0x42EB768f2244C8811C63729A21A3569731535f06');
    const ethTransactionInfo = await web3.eth.getTransaction('0xd8233d5f5f5427d3436a825ece4be0ffde58d7aa4a374f610769cb0ce33e274a')
    console.log('ethBalance', web3.utils.fromWei(ethBalance));
    console.log('info', ethTransactionInfo);

    /* Khởi tạo contract */
    const ethCOntract = new web3.eth.Contract(ERC20_ABI, '0xc778417E063141139Fce010982780140Aa0cD5Ab');

    /**
     *  Sử dụng method của contract: balanceOf để lấy giá trị
     */
    const balanceOfWallet = await ethCOntract.methods.balanceOf('0x410A2d1863C559cd60dA3362f98c5500Bc735D3C').call();
    console.log('balanceOfWallet', web3.utils.fromWei(balanceOfWallet));
    console.log(ethCOntract.methods);

    /**
     * Thực hiện quản lý wallet (trích xuất trực tiếp - ko cần confirm)
     */
    web3.eth.accounts.wallet.add('ec62da7f60db6074595d0f19e7281a7374b856e3ff016c6441ddcb519c51acd4');
    const estimateGas = await ethCOntract.methods.deposit().estimateGas({from: '0x410A2d1863C559cd60dA3362f98c5500Bc735D3C'});

    const balanceDeposit = await ethCOntract.methods.deposit().send({
        from: '0x410A2d1863C559cd60dA3362f98c5500Bc735D3C', value: web3.utils.toWei('0.01', 'ether'),
        gas: estimateGas * 2
    });
    console.log('balanceDeposit', balanceDeposit);

    const balanceOfSC = await ethCOntract.methods.balanceOf('0x410A2d1863C559cd60dA3362f98c5500Bc735D3C').call();
    console.log('balanceOfSC', web3.utils.fromWei(balanceOfSC));

    /**
     * Lấy event trong history của SC
     */
    const blockNumLatest = await web3.eth.getBlockNumber();
    const optionEvent = {
        fromBlock: blockNumLatest - 3,
    }
    await ethCOntract.getPastEvents('Transfer', optionEvent).then(function (event) {
        console.log(event)
    })

    /**
     * Lấy event realtime, sử dụng provider socket
     * Ko đảm bảo vì có thể mất dữ liệu
     * Vì thế ưu tiên dùng Http
     */
    // ethCOntract.events.Transfer({}, function (error, event) {
    //     console.log('event', event);
    // });

    /**
     * Use library ethereum multicall
     * Follow by this syntax
     */
    try {
        const ethmulticall = new ethereumMultiCall.Multicall({web3Instance: web3, tryAggregate: true});
        const contractCallContext = [
            {
                reference: 'user',
                contractAddress: '0xa4D1B10c62f96463aa2D55aDCf75DC05e0d4955e',
                abi: ERC20_ABI,
                calls: [{
                    reference: 'balance',
                    methodName: 'balanceOf',
                    methodParameters: ['0x410A2d1863C559cd60dA3362f98c5500Bc735D3C']
                }]
            },
            {
                reference: 'testContract2',
                contractAddress: '0xa4D1B10c62f96463aa2D55aDCf75DC05e0d4955e',
                abi: ERC20_ABI,
                calls: [{
                    reference: 'balance',
                    methodName: 'balanceOf',
                    methodParameters: ['0x410A2d1863C559cd60dA3362f98c5500Bc735D3C']
                }]
            }
        ];

        const result = await ethmulticall.call(contractCallContext);
        console.log('result', result);
    } catch (e) {
        console.log(e)
    }

})()