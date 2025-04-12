const date = new Date(1735643317232);
console.log(date.toUTCString());
const currentMonth = new Date().getMonth()+1; // Get current month (0-based index)
const currentYear = new Date().getFullYear();
console.log(currentMonth,currentYear)

// Function for printing the bill
async function printBill() {
    if (cart.length === 0) {
      alert("Cart is empty. Add items to the cart before printing the bill.");
      return;
    }
  
    let bill = "Restaurant Name / Store Name\n";
    bill += "Address, Contact Info, Website\n\n"; // You can replace this with your actual details
    bill += `Date: ${new Date().toLocaleDateString()} Time: ${new Date().toLocaleTimeString()}\n`;
    
    const orderId = generateOrderId(); // Generate unique Order ID
    const billNumber = await generateBillNumber(); // Get Bill Number from the backend
    
    bill += `Order ID: ${orderId}\nBill No: ${billNumber}\n\n`;
  
    bill += "------------------------------------------\n";
    bill += "Item               Qty   Price   Total\n";
    bill += "------------------------------------------\n";
  
    let total = 0;
    let saleDetails = [];
    let subtotal = 0;
    
    // Itemized List
    cart.forEach(dish => {
      const dishTotal = dish.price * dish.quantity;
      subtotal += dishTotal;
  
      bill += `${dish.name}             ${dish.quantity}    ₹${dish.price}    ₹${dishTotal}\n`;
  
      saleDetails.push({
        name: dish.name,
        number: dish.number,
        price: dish.price,
        quantity: dish.quantity,
        total: dishTotal,
      });
    });
  
    // Taxes and other details
    const taxRate = 0.05; // Assuming 5% tax rate
    const tax = subtotal * taxRate;
    const serviceCharge = 0.1 * subtotal; // Assuming 10% service charge
    const discount = 0; // Assuming no discount
    const totalAmount = subtotal + tax + serviceCharge - discount;
  
    bill += "------------------------------------------\n";
    bill += `Subtotal:                      ₹${subtotal.toFixed(2)}\n`;
    bill += `Tax (5%):                      ₹${tax.toFixed(2)}\n`;
    bill += `Service Charge:                ₹${serviceCharge.toFixed(2)}\n`;
    bill += `Discount:                      ₹${discount.toFixed(2)}\n`;
    bill += "------------------------------------------\n";
    bill += `Total Amount:                  ₹${totalAmount.toFixed(2)}\n`;
  
    bill += "------------------------------------------\n";
    bill += "Paid By: Credit Card\n"; // Assuming payment mode is Credit Card
    bill += "Thank you for visiting!\n\n";
    bill += "Visit us again at: www.store.com\n";
  
    // Prepare sale data
    const saleData = {
      orderId: orderId,  // Unique Order ID
      billNumber: billNumber,  // Bill Number
      saleDetails: saleDetails,  // Sale items
      totalAmount: totalAmount,   // Total amount after tax, service charge, etc.
      date: new Date(),          // Sale date
    };
  
    // Send sale data to backend
    fetch('/add-sale', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(saleData),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Sale added successfully:', data);
    })
    .catch(error => {
      console.error('Error adding sale:', error);
    });
  
    // Send daily sales data
    fetch('/add-daily-sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: new Date(),
        totalSales: totalAmount, // Using grand total directly
      }),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Daily sale added successfully:', data);
    })
    .catch(error => {
      console.error('Error adding daily sales:', error);
    });
  
    const currentMonth = new Date().getMonth()+1; // Get current month (0-based index)
    const currentYear = new Date().getFullYear(); 
    updateMonthlySales(totalAmount, currentMonth, currentYear)
    // Open new window for bill printing
    const newWindow = window.open('', '_blank');
    newWindow.document.write(`<pre>${bill}</pre>`);
    newWindow.document.close();
    newWindow.print();
  
    clearCart(); // Clearing the cart after printing the bill
  }