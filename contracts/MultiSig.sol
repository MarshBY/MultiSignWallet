// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract MultiSignWallet {
    address[] owners;
    mapping(address => bool) public isOwner;

    uint public immutable confirmationsRequired;

    struct Transaction {
        address to;
        uint value;
        bytes data;
        bool confirmed;
        uint confirmations;
    }

    Transaction[] public transactions;

    event TransactionAdded(uint indexed _index, address indexed _to, uint indexed _value);
    event TransactionConfirmed(uint indexed _index, address indexed _owner);
    event TransactionExecuted(uint indexed _index);

    mapping(uint => mapping(address => bool)) public ownerConfirmed; //Owner has already confirmed that index transaction?

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }

    modifier exists(uint _index) {
        require(transactions.length >= _index, "Transaction doesnt exist");
        _;
    }

    modifier notConfirmed(uint _index) {
        require(!transactions[_index].confirmed, "Transaction already confirmed");
        _;
    }

    constructor(address[] memory _owners, uint _confirmationsRequired) {
        require(_owners.length > 0, "Not enough owners");
        require(_confirmationsRequired > 0 && _confirmationsRequired <= _owners.length, "Wrong confirmations");

        for(uint i = 0; i < _owners.length; i++){
            isOwner[_owners[i]] = true;
        }
        owners = _owners;
        confirmationsRequired = _confirmationsRequired;
    }

    function AddTransaction(address _to, uint _value, bytes calldata _data) external onlyOwner {
        require(_to != address(0), "Wrong to address");

        transactions.push(Transaction({
            to : _to,
            value: _value,
            data: _data,
            confirmed: false,
            confirmations: 0
        }));

        emit TransactionAdded(transactions.length-1, _to, _value);
    }

    function ConfirmTransaction(uint _index) external onlyOwner exists(_index) notConfirmed(_index) {
        require(!ownerConfirmed[_index][msg.sender], "Owner already confirmed this Tx");

        transactions[_index].confirmations += 1;
        ownerConfirmed[_index][msg.sender] = true;

        emit TransactionConfirmed(_index, msg.sender);
    }

    function ExecuteTransaction(uint _index) external onlyOwner exists(_index) notConfirmed(_index) {
        Transaction memory t = transactions[_index];
        require(t.confirmations >= confirmationsRequired, "Not enough confirmations");

        require(address(this).balance >= t.value, "Not enough balance");
        (bool success, ) = t.to.call{value: t.value}(t.data);

        require(success, "Transaction failed");

        transactions[_index].confirmed = true;
        emit TransactionExecuted(_index);
    }

    receive() external payable {

    }

    function getOwners() external view returns(address[] memory) {
        return(owners);
    }

    function getTransactions() external view returns(Transaction[] memory) {
        return(transactions);
    }
}

//A contract for the frontend to interact with, instead of having the frontend deploy contracts we just call the function create
contract MultiSignWalletFactory {
    event MultiSignWalletOwner(address indexed _owner, address _address);

    function create(address[] memory _owners, uint _confirmationsRequired) external payable {
        MultiSignWallet newWallet = new MultiSignWallet(_owners, _confirmationsRequired);

        if(msg.value > 0 ){
            payable(newWallet).transfer(msg.value); 
        }

        for(uint i = 0; i < _owners.length; i++){ 
            emit MultiSignWalletOwner(_owners[i], address(newWallet));
        }
    }
}