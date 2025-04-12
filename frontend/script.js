
let menu = []; // Holds the menu data
// let selectedIndex = -1; // Tracks the selected item in search suggestions
// let debounceTimer; // Timer to handle debouncing
let cart = [];


// Function to delete image when a dish is deleted
const deleteDishImage = (dishNumber) => {
  const uploadDir = 'public/uploads';

  // Check if the directory exists
  if (!fs.existsSync(uploadDir)) return;

  // Get all files in the upload directory
  const files = fs.readdirSync(uploadDir);

  // Find and delete files that match the dish number
  files.forEach((file) => {
    if (file.startsWith(dishNumber)) {
      const filePath = path.join(uploadDir, file);
      fs.unlinkSync(filePath); // Delete the file
      console.log(`Deleted file: ${filePath}`);
    }
  });
};

function handleCategoryChange() {
  const categoryDropdown = document.getElementById("dishCategory");
  const newCategory = document.getElementById("newCategory");

  if (categoryDropdown.value === "new") {
    newCategory.style.display = "block";
  } else {
    newCategory.style.display = "none";
  }
}

// Fetch Menu from the Server
async function fetchMenu() {
  try {
    const response = await fetch('/api/menu');
    const data = await response.json();
    allItems = data;
    menu = data;
    displayMenu(allItems); // Display the menu once fetched
  } catch (error) {
    console.error('Error fetching menu:', error);
  }
}

// Display Menu with Categories & Images
// Function to display the menu based on selected category
function displayMenu(menuData, selectedCategory = "all") {
  const dishList = document.getElementById("dishList");
  dishList.innerHTML = ""; // Clear the existing menu

  if (!Array.isArray(menuData)) {
    console.error("menuData is not an array:", menuData);
    return;
  }

  // Filter dishes based on category
  const filteredMenu = selectedCategory === "all"
    ? menuData
    : menuData.filter(dish => dish.category === selectedCategory);

  // Group filtered dishes by category
  const categorizedDishes = {};
  filteredMenu.forEach((dish) => {
    if (!categorizedDishes[dish.category]) {
      categorizedDishes[dish.category] = [];
    }
    categorizedDishes[dish.category].push(dish);
  });

  // Display grouped dishes
  Object.keys(categorizedDishes).forEach((category) => {
    const categorySection = document.createElement("div");
    categorySection.classList.add("category-section");
    categorySection.innerHTML = `<h2>${category}</h2>`;

    categorizedDishes[category].forEach((dish) => {
      const dishElement = document.createElement("div");
      dishElement.classList.add("dish");
      dishElement.innerHTML = `
        <img src="${dish.imageUrl}" alt="${dish.name}" class="dish-image">
        <h3>${dish.name} (#${dish.number})</h3>
        <p>Price: ₹${dish.price}</p>
        <input class="menu-input" type="number" id="quantity-${dish._id}" value="1" min="1">
        <button class="m-addtocart" onclick="addToCart('${dish._id}')">Add to Cart</button>
        <button class="m-deletedish" onclick="deleteDish('${dish._id}')">Delete Dish</button>
      `;
      categorySection.appendChild(dishElement);
    });

    dishList.appendChild(categorySection);
  });
}

// Event listener for category filter dropdown
document.getElementById("categoryFilter").addEventListener("change", function () {
  const selectedCategory = this.value;
  displayMenu(allItems, selectedCategory);
});

// Initialize on page load
window.onload = async function () {
  await fetchCategories();
  await fetchMenu();
  filterMenu()
};
function filterMenu() {
  if (!allItems || allItems.length === 0) {
    console.warn("No menu items available for filtering! Fetch items first.");
    return;
  }

  const selectedCategory = document.getElementById("categoryFilter").value;
  console.log("Selected category:", selectedCategory);

  const filteredMenu = selectedCategory === "all"
    ? allItems
    : allItems.filter(dish => dish.category === selectedCategory);

  console.log("Filtered menu items:", filteredMenu);

  displayMenu(filteredMenu, selectedCategory);
}



let allItems = []
async function fetchCategories() {
  try {
    const response = await fetch("/api/categories");
    if (!response.ok) throw new Error("Failed to fetch categories");
    
    const categories = await response.json();

    // Populate categoryFilter dropdown
    const categoryFilter = document.getElementById("categoryFilter");
    categoryFilter.innerHTML = `
      <option value="all">All</option>
      ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join("")}
    `;

    // Populate dishCategory dropdown
    const dishCategory = document.getElementById("dishCategory");
    dishCategory.innerHTML = `
      ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join("")}
      <option value="new">Add New Category</option>
    `;

  } catch (err) {
    console.error("Error fetching categories:", err);
  }
}

async function fetchItems() {
  try {
    const response = await fetch("/api/items");
    if (!response.ok) throw new Error("Failed to fetch items");

    const data = await response.json();
    console.log("Raw API response:", data); // Check raw data

    if (!Array.isArray(data) || data.length === 0) {
      console.warn("Fetched menu items are empty or invalid.");
      return;
    }

    allItems = data;
    console.log("Fetched menu items:", allItems); // Ensure it's populated

    filterMenu(); // Automatically filter after fetching
  } catch (err) {
    console.error("Error fetching items:", err);
  }
}



let dishes = [];  // Initialize an empty array to store dish names

// This function will be triggered when the user types into an input field
function showSuggestions(event) {
  const searchTerm = event.target.value.toLowerCase();
  const filteredDishes = dishes.filter(dish => dish.toLowerCase().includes(searchTerm));

  const suggestionsList = document.getElementById('suggestionsList');  // Ensure the ID is correct
  if (suggestionsList) {  // Check if the element exists
    suggestionsList.innerHTML = '';  // Clear previous suggestions

    filteredDishes.forEach(dish => {
      const listItem = document.createElement('li');
      listItem.textContent = dish;
      suggestionsList.appendChild(listItem);
    });
  } else {
    console.error('Suggestions list not found!');
  }
}


// Add Dish to Cart with Quantity
function addToCart(dishId) {
  const dish = menu.find(d => d._id === dishId);
  if (!dish) return;

  const quantityInput = document.getElementById(`quantity-${dishId}`);
  const quantity = parseInt(quantityInput.value) || 1; // Default to 1 if invalid

  const existingDish = cart.find(item => item._id === dishId);
  if (existingDish) {
    existingDish.quantity += quantity;
  } else {
    cart.push({ ...dish, quantity });
  }

  updateCart();
}

// Update Cart Display
function updateCart() {
  const cartSection = document.getElementById('cart');
  const totalAmount = document.getElementById('totalAmount');
  cartSection.innerHTML = '';  // Clear the cart display

  let total = 0;

  cart.forEach((dish, index) => {
    const cartItem = document.createElement('div');
    cartItem.classList.add('cart-item');

    // Display cart item with - and + buttons
    cartItem.innerHTML = `
      <h3>${dish.name} (${dish.number})</h3>
                <p>₹${dish.price}</p>
                <button id = "decrease-btn" , class="quantity-btn" onclick="updateQuantity(${index}, 'decrease')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="33.05" height="33.05" viewBox="0 0 24 24" fill="none">
                            <path d="M15 12.75C15.4142 12.75 15.75 12.4142 15.75 12C15.75 11.5858 15.4142 11.25 15 11.25H9C8.58579 11.25 8.25 11.5858 8.25 12C8.25 12.4142 8.58579 12.75 9 12.75H15Z" fill="#FFC300"/>
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M12 1.25C6.06294 1.25 1.25 6.06294 1.25 12C1.25 17.9371 6.06294 22.75 12 22.75C17.9371 22.75 22.75 17.9371 22.75 12C22.75 6.06294 17.9371 1.25 12 1.25ZM2.75 12C2.75 6.89137 6.89137 2.75 12 2.75C17.1086 2.75 21.25 6.89137 21.25 12C21.25 17.1086 17.1086 21.25 12 21.25C6.89137 21.25 2.75 17.1086 2.75 12Z" fill="#FFC300"/>
                        </svg>
                    </button>
                    
                </button>
                <span id = "span-qty">${dish.quantity}</span>  <!-- Show the current quantity -->
                <button id = "increase-btn" ,class="quantity-btn" onclick="updateQuantity(${index}, 'increase')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="33.05" height="33.05" viewBox="0 0 24 24" fill="none">
                        <path d="M12.75 9C12.75 8.58579 12.4142 8.25 12 8.25C11.5858 8.25 11.25 8.58579 11.25 9L11.25 11.25H9C8.58579 11.25 8.25 11.5858 8.25 12C8.25 12.4142 8.58579 12.75 9 12.75H11.25V15C11.25 15.4142 11.5858 15.75 12 15.75C12.4142 15.75 12.75 15.4142 12.75 15L12.75 12.75H15C15.4142 12.75 15.75 12.4142 15.75 12C15.75 11.5858 15.4142 11.25 15 11.25H12.75V9Z" fill="#39FF14"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M12 1.25C6.06294 1.25 1.25 6.06294 1.25 12C1.25 17.9371 6.06294 22.75 12 22.75C17.9371 22.75 22.75 17.9371 22.75 12C22.75 6.06294 17.9371 1.25 12 1.25ZM2.75 12C2.75 6.89137 6.89137 2.75 12 2.75C17.1086 2.75 21.25 6.89137 21.25 12C21.25 17.1086 17.1086 21.25 12 21.25C6.89137 21.25 2.75 17.1086 2.75 12Z" fill="#39FF14"/>

                    </svg>
                
                </button>
                <button id ="remove-btn" onclick="removeFromCart(${index})">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="#FF073A" width="33" height="33" viewBox="0 0 56 56">
                        <path d="M 44.5235 48.6602 L 46.1407 14.3945 L 48.4844 14.3945 C 49.4454 14.3945 50.2187 13.5976 50.2187 12.6367 C 50.2187 11.6758 49.4454 10.8555 48.4844 10.8555 L 38.2422 10.8555 L 38.2422 7.3398 C 38.2422 3.9883 35.9688 1.8086 32.3595 1.8086 L 23.5938 1.8086 C 19.9844 1.8086 17.7344 3.9883 17.7344 7.3398 L 17.7344 10.8555 L 7.5391 10.8555 C 6.6016 10.8555 5.7813 11.6758 5.7813 12.6367 C 5.7813 13.5976 6.6016 14.3945 7.5391 14.3945 L 9.8829 14.3945 L 11.5000 48.6836 C 11.6641 52.0586 13.8907 54.1914 17.2657 54.1914 L 38.7579 54.1914 C 42.1095 54.1914 44.3595 52.0351 44.5235 48.6602 Z M 21.4844 7.5742 C 21.4844 6.2383 22.4688 5.3008 23.8751 5.3008 L 32.1016 5.3008 C 33.5313 5.3008 34.5157 6.2383 34.5157 7.5742 L 34.5157 10.8555 L 21.4844 10.8555 Z M 17.6173 50.6758 C 16.2579 50.6758 15.2500 49.6445 15.1797 48.2852 L 13.5391 14.3945 L 42.3907 14.3945 L 40.8438 48.2852 C 40.7735 49.6680 39.7891 50.6758 38.4063 50.6758 Z M 34.9610 46.5508 C 35.7344 46.5508 36.3204 45.9180 36.3438 45.0273 L 37.0469 20.2773 C 37.0704 19.3867 36.4610 18.7305 35.6641 18.7305 C 34.9376 18.7305 34.3282 19.4102 34.3048 20.2539 L 33.6016 45.0273 C 33.5782 45.8711 34.1641 46.5508 34.9610 46.5508 Z M 21.0626 46.5508 C 21.8595 46.5508 22.4454 45.8711 22.4219 45.0273 L 21.7188 20.2539 C 21.6954 19.4102 21.0626 18.7305 20.3360 18.7305 C 19.5391 18.7305 18.9532 19.3867 18.9766 20.2773 L 19.7032 45.0273 C 19.7266 45.9180 20.2891 46.5508 21.0626 46.5508 Z M 29.4298 45.0273 L 29.4298 20.2539 C 29.4298 19.4102 28.7969 18.7305 28.0235 18.7305 C 27.2500 18.7305 26.5938 19.4102 26.5938 20.2539 L 26.5938 45.0273 C 26.5938 45.8711 27.2500 46.5508 28.0235 46.5508 C 28.7735 46.5508 29.4298 45.8711 29.4298 45.0273 Z"/>
                    </svg>
                </button>
    `;

    cartSection.appendChild(cartItem);
    total += dish.price * dish.quantity;  // Calculate total with quantity
  });

  totalAmount.innerText = `₹${total}`;
}

// Update Quantity in Cart (using - and + buttons)
function updateQuantity(index, operation) {
  if (operation === 'decrease') {
    if (cart[index].quantity > 1) {
      cart[index].quantity -= 1;  // Decrease quantity
    } else {
      cart.splice(index, 1);  // Remove the item if quantity is 0
    }
  } else if (operation === 'increase') {
    cart[index].quantity += 1;  // Increase quantity
  }

  updateCart();  // Re-render the cart display
}



// Remove Item from Cart
function removeFromCart(index) {
  cart.splice(index, 1);  // Remove item from the cart
  updateCart();  // Update the cart display
}

// Empty Cart
function clearCart() {
  cart = [];
  updateCart();
}

// Search Functionality with Debouncing


let selectedIndex = -1; // Initialize selected index

function commonSearch(event) {
  const searchInput = document.getElementById('searchInput').value.trim().toLowerCase();
  const suggestionsList = document.getElementById('suggestions');
  suggestionsList.innerHTML = ''; // Clear previous suggestions

  if (!searchInput) {
    selectedIndex = -1; // Reset selected index if search input is empty
    return; // Exit if search input is empty
  }

  // Check if the input is numeric to determine if it's a dish number
  const searchNumber = isNaN(searchInput) ? null : parseInt(searchInput);

  // Filter dishes based on search input (by name or exact dish number)
  const filteredDishes = menu.filter(dish => {
    const dishNumberMatch = searchNumber !== null && dish.number === searchNumber;
    const dishNameMatch = dish.name.toLowerCase().includes(searchInput);

    return dishNameMatch || dishNumberMatch;
  });

  // Add suggestion items to the list
  filteredDishes.forEach((dish, index) => {
    const suggestionItem = document.createElement('div');
    suggestionItem.classList.add('suggestion-item');
    suggestionItem.innerHTML = `${dish.name} (${dish.number}) - ₹${dish.price}`;

    // Highlight the selected dish based on keyboard navigation
    if (index === selectedIndex) {
      suggestionItem.classList.add('highlight');
    }

    // Add click event to add to cart when a suggestion is clicked
    suggestionItem.onclick = () => {
      addToCart(dish._id);
      document.getElementById('searchInput').value = '';
      suggestionsList.innerHTML = ''; // Clear suggestions
    };

    suggestionsList.appendChild(suggestionItem);
  });

  // Handle keyboard navigation and Enter key press
  if (event.key === 'ArrowDown') {
    // Move down in the list
    if (selectedIndex < filteredDishes.length - 1) {
      selectedIndex++;
    } else {
      selectedIndex = 0; // Wrap around to the first suggestion if at the end
    }
    updateSuggestionsHighlight(filteredDishes);
  } else if (event.key === 'ArrowUp') {
    // Move up in the list
    if (selectedIndex > 0) {
      selectedIndex--;
    } else {
      selectedIndex = filteredDishes.length - 1; // Wrap around to the last suggestion if at the top
    }
    updateSuggestionsHighlight(filteredDishes);
  } else if (event.key === 'Enter') {
    // If a dish is highlighted, add it to the cart
    if (selectedIndex >= 0 && filteredDishes[selectedIndex]) {
      addToCart(filteredDishes[selectedIndex]._id);
      document.getElementById('searchInput').value = '';
      suggestionsList.innerHTML = ''; // Clear suggestions
    } else if (filteredDishes.length === 1) {
      // If only one dish is found, add it to the cart automatically
      addToCart(filteredDishes[0]._id);
      document.getElementById('searchInput').value = '';
      suggestionsList.innerHTML = ''; // Clear suggestions
    }
  }

  // Display "No dishes found" if no matching dishes
  if (filteredDishes.length === 0) {
    const noResults = document.createElement('div');
    noResults.textContent = 'No dishes found';
    suggestionsList.appendChild(noResults);
  }
}

// Update the highlight for the selected suggestion
function updateSuggestionsHighlight(filteredDishes) {
  const suggestionsList = document.getElementById('suggestions');
  const suggestionItems = suggestionsList.querySelectorAll('.suggestion-item');

  suggestionItems.forEach((item, index) => {
    item.classList.remove('highlight');
    if (index === selectedIndex) {
      item.classList.add('highlight');
    }
  });
}

// Debounce function to limit search frequency
let debounceTimer;
function debounceSearch(event) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    commonSearch(event);
  }, 300); // Adjust 300ms delay based on your preference
}

// Bind the debounced search to the input field
document.getElementById('searchInput').addEventListener('input', debounceSearch);


// Debounce function to limit search frequency
function debounceSearch(event) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    commonSearch(event);
  }, 300); // Adjust 300ms delay based on your preference
}

// Function for printing the bill
async function printBill() {
  if (cart.length === 0) {
    alert("Cart is empty. Add items to the cart before printing the bill.");
    return;
  }

  let bill = `<div id="thermalPreview">
                <style>
                  table { width: 100%; border-collapse: collapse; font-family: monospace; font-size: 12px; }
                  th, td { border-bottom: 1px solid black; padding: 4px; text-align: left; }
                  th { text-align: center; }
                </style>
                <div style="text-align: center; font-family: monospace; font-size: 12px;">
                  <strong>RetailHub24x7</strong><br>
                  Address, Contact Info, Website<br>
                  ---------------------------------<br>
                  Date: ${new Date().toLocaleDateString()} Time: ${new Date().toLocaleTimeString()}<br>
                  Order ID: ${generateOrderId()}<br>
                  Bill No: ${await generateBillNumber()}<br>
                  ---------------------------------
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>`;

  let subtotal = 0;
  let saleDetails = [];
  cart.forEach(dish => {
    const dishTotal = dish.price * dish.quantity;
    subtotal += dishTotal;
    bill += `<tr>
               <td>${dish.name}</td>
               <td>${dish.quantity}</td>
               <td>₹${dish.price}</td>
               <td>₹${dishTotal}</td>
             </tr>`;
    
    saleDetails.push({ name: dish.name, number: dish.number, price: dish.price, quantity: dish.quantity, total: dishTotal });
  });

  const taxRate = 0.05;
  const tax = subtotal * taxRate;
  const serviceCharge = 0.1 * subtotal;
  const discount = 0;
  const totalAmount = subtotal + tax + serviceCharge - discount;

  bill += `</tbody>
           </table>
           <div style="font-family: monospace; font-size: 12px;">
             ---------------------------------<br>
             Subtotal: ₹${subtotal.toFixed(2)}<br>
             Tax (5%): ₹${tax.toFixed(2)}<br>
             Service Charge: ₹${serviceCharge.toFixed(2)}<br>
             Discount: ₹${discount.toFixed(2)}<br>
             ---------------------------------<br>
             <strong>Total Amount:₹${totalAmount.toFixed(2)}</strong><br>
             ---------------------------------<br>
             Thank you for visiting!<br>
             Visit us again at: www.store.com
           </div>
         </div>`;

  // Display preview in a modal
  let modal = document.createElement("div");
  modal.id = "billModal";
  modal.style.position = "fixed";
  modal.style.top = "50%";
  modal.style.left = "50%";
  modal.style.transform = "translate(-50%, -50%)";
  modal.style.backgroundColor = "white";
  modal.style.padding = "20px";
  modal.style.border = "1px solid black";
  modal.style.zIndex = "1000";
  modal.innerHTML = `<div>${bill}<br>
                     <div style="text-align: center; margin-top: 10px;">
                       <button onclick="document.body.removeChild(document.getElementById('billModal'))">Close</button>
                     </div>
                   </div>`;
  document.body.appendChild(modal);
  // Check if printer is connected
  navigator.usb.getDevices().then(devices => {
    if (devices.length > 0) {
      console.log("Printer connected. Printing...");
      window.print();
    } else {
      console.log("Printer not connected. Showing preview in modal.");
    }
  });

  // Save Sale Data to Database
  const saleData = {
    orderId: generateOrderId(),
    billNumber: await generateBillNumber(),
    saleDetails: saleDetails,
    totalAmount: totalAmount,
    date: new Date(),
  };

  fetch('/add-sale', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(saleData),
  }).then(response => response.json())
    .then(data => console.log('Sale added successfully:', data))
    .catch(error => console.error('Error adding sale:', error));

  fetch('/add-daily-sales', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: new Date(), totalSales: totalAmount }),
  }).then(response => response.json())
    .then(data => console.log('Daily sale added successfully:', data))
    .catch(error => console.error('Error adding daily sales:', error));

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  updateMonthlySales(totalAmount, currentMonth, currentYear);

  clearCart();
}








// Function to generate a unique order ID (for example, based on the current timestamp)
function generateOrderId() {
  return `ORD-${Date.now()}`;  // Generates a unique Order ID based on the current timestamp
}

// Function to generate the next bill number (you can adjust it to your requirements)
async function generateBillNumber() {
  try {
    const response = await fetch('/generate-bill-number');
    const data = await response.json();
    return data.billNumber; // Return the bill number from the backend
  } catch (error) {
    console.error('Error fetching bill number:', error);
    return null;
  }
}




function updateMonthlySales(totalSales, month, year) {
  const salesData = {
    month: month,  // You can use JavaScript's Date object to get the current month
    year: year,    // You can use JavaScript's Date object to get the current year
    totalSales: totalSales,
  };

  fetch('/add-monthly-sales', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(salesData), // Send the total sales data in the body
  })
    .then(response => response.json())
    .then(data => {
      if (data.message) {
        console.log(data.message);  // Log success message
      } else {
        console.error(data.error);  // Log any error
      }
    })
    .catch(error => {
      console.error('Error updating monthly sales:', error);
    });
}

// Function to fetch sales from the server
async function fetchSales() {
  try {
    const response = await fetch('/get-sales', { method: 'GET' });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Sales data fetched successfully:', data);
    displaySales(data);  // Call displaySales to display the data
  } catch (error) {
    console.error('Error fetching sales:', error);
  }
}


// Function to delete a dish from the menu
async function deleteDish(dishId) {
  try {
    const response = await fetch(`/api/menu/${dishId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      alert('Dish deleted successfully');
      fetchMenu();  // Fetch updated menu
    } else {
      alert('Failed to delete dish');
    }
  } catch (error) {
    alert('Error deleting dish');
    console.error(error);
  }
}

// Function to print the searched bill in the same format as the new bill
async function printSearchedBill() {
  const orderIdInput = document.getElementById("order-id").value.trim();
  const billNumberInput = document.getElementById("bill-number").value.trim();

  if (!orderIdInput && !billNumberInput) {
    alert("Please provide either an Order ID or a Bill Number to search.");
    return;
  }

  try {
    const url = `/get-bill?orderId=${encodeURIComponent(orderIdInput)}&billNumber=${encodeURIComponent(billNumberInput)}`;
    const response = await fetch(url, { method: 'GET' });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const fetchedData = await response.json();
    if (!fetchedData.success) {
      alert("Bill not found.");
      return;
    }

    const bill = fetchedData.bill;
    let billDetails = `<div id="thermalPreview">
                        <style>
                          table { width: 100%; border-collapse: collapse; font-family: monospace; font-size: 12px; }
                          th, td { border-bottom: 1px solid black; padding: 4px; text-align: left; }
                          th { text-align: center; }
                        </style>
                        <div style="text-align: center; font-family: monospace; font-size: 12px;">
                          <strong>RetailHub24x7</strong><br>
                          Address, Contact Info, Website<br>
                          ---------------------------------<br>
                          Date: ${new Date(bill.date).toLocaleDateString()} Time: ${new Date(bill.date).toLocaleTimeString()}<br>
                          Order ID: ${bill.orderId}<br>
                          Bill No: ${bill.billNumber}<br>
                          ---------------------------------
                        </div>
                        <table>
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th>Qty</th>
                              <th>Price</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>`;

    let subtotal = 0;
    bill.saleDetails.forEach(dish => {
      const dishTotal = dish.price * dish.quantity;
      subtotal += dishTotal;
      billDetails += `<tr>
                       <td>${dish.name}</td>
                       <td>${dish.quantity}</td>
                       <td>₹${dish.price}</td>
                       <td>₹${dishTotal}</td>
                     </tr>`;
    });

    const taxRate = 0.05;
    const tax = subtotal * taxRate;
    const serviceCharge = 0.1 * subtotal;
    const discount = 0;
    const totalAmount = subtotal + tax + serviceCharge - discount;

    billDetails += `</tbody>
                   </table>
                   <div style="font-family: monospace; font-size: 12px;">
                     ---------------------------------<br>
                     Subtotal: ₹${subtotal.toFixed(2)}<br>
                     Tax (5%): ₹${tax.toFixed(2)}<br>
                     Service Charge: ₹${serviceCharge.toFixed(2)}<br>
                     Discount: ₹${discount.toFixed(2)}<br>
                     ---------------------------------<br>
                     <strong>Total Amount: ₹${totalAmount.toFixed(2)}</strong><br>
                     ---------------------------------<br>
                     Thank you for visiting!<br>
                     Visit us again at: www.store.com
                   </div>
                 </div>`;

    let modal = document.createElement("div");
    modal.id = "billModal";
    modal.style.position = "fixed";
    modal.style.top = "50%";
    modal.style.left = "50%";
    modal.style.transform = "translate(-50%, -50%)";
    modal.style.backgroundColor = "white";
    modal.style.padding = "20px";
    modal.style.border = "1px solid black";
    modal.style.zIndex = "1000";
    modal.innerHTML = `<div>${billDetails}<br>
                       <div style="text-align: center; margin-top: 10px;">
                         <button onclick="document.body.removeChild(document.getElementById('billModal'))">Close</button>
                       </div>
                     </div>`;
    document.body.appendChild(modal);

    navigator.usb.getDevices().then(devices => {
      if (devices.length > 0) {
        console.log("Printer connected. Printing...");
        window.print();
      } else {
        console.log("Printer not connected. Showing preview in modal.");
      }
    });
  } catch (error) {
    console.error("Error fetching bill:", error);
    alert("Failed to fetch the bill. Please try again.");
  }
}


function toggleCart() {
  const cartSection = document.getElementById('cartSection');
  const toggleButton = document.getElementById('toggleCartButton');
  cartSection.classList.toggle('active');
  toggleButton.classList.toggle('hidden');
}

// Function to show the selected section and hide the others
function showSection(sectionId) {
  // Hide all sections
  const sections = document.querySelectorAll('.section');
  sections.forEach(section => {
    section.classList.add('hidden');
  });

  if (sectionId == 'salesSection' || sectionId == 'manageMenuSection' || sectionId == 'search-bill') {
    document.getElementById("defaultSection").style.display = 'none';
    loadSalesData();
  }
  else {
    document.getElementById("defaultSection").style.display = 'block';
  }
  // Show the clicked section
  const sectionToShow = document.getElementById(sectionId);
  sectionToShow.classList.remove('hidden');
}

function clearSales() {
  const passwordModal = document.getElementById("passwordModal");
  passwordModal.classList.remove("hidden");
}

function validatePassword() {
  const enteredPassword = document.getElementById("salesPassword").value;
  const correctPassword = "123"; // Replace with your actual password logic

  if (enteredPassword === correctPassword) {
    console.log("Sales cleared.");
    // Add logic to clear sales from the database
    closeModal();
  } else {
    alert("Incorrect password. Please try again.");
  }
}

let salesTypeToClear = ''; // This will store whether it's daily or monthly sales to clear

// Open the modal for clearing sales (daily or monthly)
function openModal(salesType) {
  salesTypeToClear = salesType;
  document.getElementById('passwordModal').classList.remove('hidden');
}

// Close the modal
function closeModal() {
  document.getElementById('passwordModal').classList.add('hidden');
  document.getElementById('salesPassword').value = ''; // Reset password field
}

// Validate the password
function validatePassword() {
  const password = document.getElementById('salesPassword').value;

  const dailyPassword = 'd123'; // Password for clearing daily sales
  const monthlyPassword = 'm123'; // Password for clearing monthly sales

  if (salesTypeToClear === 'daily' && password === dailyPassword) {
    clearDailySales();
  } else if (salesTypeToClear === 'monthly' && password === monthlyPassword) {
    clearMonthlySales();
  } else {
    alert('Incorrect password');
  }

  closeModal(); // Close the modal after validation
}

// Function to clear daily sales
function clearDailySales() {
  // Call the backend to clear daily sales
  fetch('/clear-daily-sales', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password: 'd123' }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.message) {
        alert(data.message);
        displaySales({ dailySales: [], monthlySales: [] }); 
        fetchSales()// Refresh sales data
      } else {
        alert('Failed to clear daily sales');
      }
    })
    .catch(error => console.error('Error:', error));
  }

// Function to clear monthly sales
function clearMonthlySales() {
  // Call the backend to clear monthly sales
  fetch('/clear-monthly-sales', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password: 'm123' }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.message) {
        alert(data.message);
        displaySales({ dailySales: [], monthlySales: [] });
        fetchSales() // Refresh sales data
      } else {
        alert('Failed to clear monthly sales');
      }
    })
    .catch(error => console.error('Error:', error));
    
}


function displaySales(salesData) {
  const { dailySales = [], monthlySales = [] } = salesData;

  const dailySalesTable = document.getElementById('dailySalesTable');
  const monthlySalesSection = document.getElementById('monthlySalesSection');

  if (!dailySalesTable || !monthlySalesSection) {
    console.error('Sales tables not found!');
    return;
  }

  // Aggregate sales by date
  const dailyTableBody = dailySalesTable.getElementsByTagName('tbody')[0];
  dailyTableBody.innerHTML = ''; // Clear the daily table

  // Aggregate sales by date
  const aggregatedSales = dailySales.reduce((acc, sale) => {
    const date = new Date(sale.date).toLocaleDateString('en-GB'); // Format date as 'DD/MM/YYYY'
    const totalSales = parseFloat(sale.totalSales); // Ensure totalSales is a number

    if (isNaN(totalSales)) {
      console.error('Invalid total sales value:', sale.totalSales);
      return acc; // Skip invalid entries
    }

    if (!acc[date]) {
      acc[date] = 0; // Initialize total for the date
    }
    acc[date] += totalSales; // Add the total sales for that date
    return acc;
  }, {});

  // Populate the table with aggregated data
  Object.entries(aggregatedSales).forEach(([date, totalSales]) => {
    const dailyRow = dailyTableBody.insertRow();
    dailyRow.innerHTML = `<td>${date}</td><td>₹${totalSales}</td>`;
  });

  // Process Monthly Sales
  monthlySalesSection.innerHTML = ''; // Clear the monthly sales section

  monthlySales.forEach(sale => {
    const { month, year, totalSales } = sale;

    if (month && year) {
      const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' }); // Get the month name
      const total = totalSales || 0; // Ensure totalSales has a default value if undefined

      const monthlyTable = document.createElement('table');
      monthlyTable.border = '1';

      monthlyTable.innerHTML = `
        <thead>
          <tr><th>Month</th><th>Total Sales</th></tr>
        </thead>
        <tbody>
          <tr><td>${monthName} ${year}</td><td>₹${total}</td></tr>
        </tbody>
      `;

      monthlySalesSection.appendChild(monthlyTable);
    } else {
      console.error('Invalid month/year format:', sale);
    }
  });
}



function toggleNavOptions() {
  const navOptions = document.getElementById('nav-options');
  const hamburger = document.getElementById('hamburger');

  // Toggle visibility of the navigation menu
  if (navOptions.classList.contains('visible')) {
    navOptions.classList.remove('visible');
  } else {
    navOptions.classList.add('visible');
  }

  // Toggle hamburger icon animation
  hamburger.classList.toggle('active');
}

document.getElementById('searchInput').addEventListener('input', function () {
  let searchTerm = this.value.trim();
  let suggestions = document.getElementById('suggestions');

  if (searchTerm.length > 0) {
    // Show the suggestions box if there's input
    suggestions.style.display = 'block';
    suggestions.classList.add('visible');

    // Perform the search logic to display the results dynamically
    // For example, filter your dish list
    let matchingDishes = dishes.filter(dish => dish.name.includes(searchTerm));
    suggestions.innerHTML = matchingDishes.map(dish => `
      <div class="suggestion-item" onclick="selectDish('${dish.id}')">
        ${dish.name}
      </div>
    `).join('');
  } else {
    // Hide the suggestions box when there's no input
    suggestions.style.display = 'none';
    suggestions.classList.remove('visible');
  }
});

// Call fetchSales() when the page loads to show the sales data
document.addEventListener('DOMContentLoaded', fetchSales)
// Function to load sales data
function loadSalesData() {
  fetch('/get-sales')
    .then(response => response.json())
    .then(data => {
      console.log('Sales data fetched successfully:', data);
      displaySales(data); // Call your display function here
    })
    .catch(error => {
      console.error('Error fetching sales:', error);
    });
}

// Call the function when the page loads or when required
document.addEventListener('DOMContentLoaded', loadSalesData);;


// Call fetchSales() when the page loads to show the sales data
document.addEventListener('DOMContentLoaded', fetchSales);

// Assuming you have an event listener for form submission
async function addDish(event) {
  event.preventDefault();

  const name = document.getElementById("dishName").value.trim();
  const number = document.getElementById("dishNumber").value.trim();
  const price = document.getElementById("dishPrice").value.trim();
  const categoryDropdown = document.getElementById("dishCategory");
  const newCategoryInput = document.getElementById("newCategory");
  const imageInput = document.getElementById("dishImage");
  const imageFile = imageInput.files[0]; // Get selected image file

  // Ensure category selection logic is correct
  let category = categoryDropdown.value;
  if (category === "new") {
    category = newCategoryInput.value.trim();
    if (!category) {
      alert("Please enter a new category name!");
      return;
    }
  }

  // Ensure all fields are filled
  if (!name || !number || !price || !category || !imageFile) {
    alert("Please fill in all fields, including an image.");
    return;
  }

  // Prepare FormData for image upload
  const formData = new FormData();
  formData.append("number", parseInt(number));
  formData.append("name", name);
  formData.append("price", parseFloat(price));
  formData.append("category", category);
  formData.append("image", imageFile); // Attach image

  try {
    const response = await fetch("/add-dish", {
      method: "POST",
      body: formData, // Sending as FormData
    });

    const result = await response.json();
    if (response.ok) {
      console.log("Dish added successfully:", result);
      
      // ✅ Fetch updated menu after adding the dish
      fetchMenu();

      // ✅ Fetch updated categories in case a new category was added
      fetchCategories();

      // ✅ Clear form fields
      event.target.reset();
    } else {
      console.log("Error adding dish:", result);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}


function displayBill(bill) {
  const billContainer = document.getElementById('bill-container');
  document.getElementById("print-button").removeAttribute("style");
  if (billContainer) {
    let billDetails = `
      <pre>
        RetailHub24x7
        Address, Contact Info, Website

        Date: ${new Date(bill.date).toLocaleDateString()} Time: ${new Date(bill.date).toLocaleTimeString()}
        Order ID: ${bill.orderId}
        Bill No: ${bill.billNumber}

        ------------------------------------------
        Item                Qty    Price    Total
        ------------------------------------------
    `;

    let subtotal = 0;

    // Itemized List
    bill.saleDetails.forEach(item => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      billDetails += `
        ${item.name}          ${item.quantity}    ₹${item.price}    ₹${itemTotal}
      `;
    });

    // Taxes and other details
    const taxRate = 0.05; // Assuming 5% tax rate
    const tax = subtotal * taxRate;
    const serviceCharge = 0.1 * subtotal; // Assuming 10% service charge
    const discount = 0; // Assuming no discount
    const totalAmount = subtotal + tax + serviceCharge - discount;

    billDetails += `
      ------------------------------------------
      Subtotal: ₹${subtotal.toFixed(2)}
      Tax (5%): ₹${tax.toFixed(2)}
      Service Charge: ₹${serviceCharge.toFixed(2)}
      Discount: ₹${discount.toFixed(2)}
      ------------------------------------------
      Total Amount: ₹${totalAmount.toFixed(2)}

      ------------------------------------------
      Paid By: Credit Card
      Thank you for visiting!

      Visit us again at: www.store.com
      </pre>
    `;

    // Update the HTML to show the bill
    billContainer.innerHTML = billDetails;
  } else {
    console.error("Element with id 'bill-container' not found.");
  }
  document.getElementById("print-button").removeAttribute("styles");
}

function searchBill() {
  const orderId = document.getElementById('order-id').value;
  const billNumber = document.getElementById('bill-number').value;

  // Make a call to the backend to fetch the bill details
  fetch(`/get-bill?orderId=${orderId}&billNumber=${billNumber}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        displayBill(data.bill);
      } else {
        alert("Bill not found.");
      }
    })
    .catch(error => console.error('Error fetching bill:', error));
}

// let selectedIndex = -1; // Index for keyboard navigation

function commonSearch(event) {
  const searchInput = document.getElementById('searchInput').value.trim().toLowerCase();
  const suggestionsList = document.getElementById('suggestions');
  suggestionsList.innerHTML = ''; // Clear previous suggestions

  if (!searchInput) {
    selectedIndex = -1;
    return; // Exit if search input is empty
  }

  const searchNumber = isNaN(searchInput) ? null : parseInt(searchInput);

  const filteredDishes = menu.filter(dish => {
    const dishNumberMatch = searchNumber !== null && dish.number === searchNumber;
    const dishNameMatch = dish.name.toLowerCase().includes(searchInput);
    return dishNameMatch || dishNumberMatch;
  });

  // Add suggestion items to the list
  filteredDishes.forEach((dish, index) => {
    const suggestionItem = document.createElement('div');
    suggestionItem.classList.add('suggestion-item');
    suggestionItem.innerHTML = `${dish.name} (${dish.number}) - ₹${dish.price}`;

    // Highlight the selected dish
    if (index === selectedIndex) {
      suggestionItem.classList.add('highlight');
    }

    // Add click event to add the dish to the cart
    suggestionItem.onclick = () => {
      addToCart(dish._id);
      resetSearch();
    };

    suggestionsList.appendChild(suggestionItem);
  });

  // Handle Enter key behavior
  if (event.key === 'Enter') {
    if (filteredDishes.length === 1) {
      // If only one result, add it directly
      addToCart(filteredDishes[0]._id);
      resetSearch();
    } else if (filteredDishes[selectedIndex]) {
      // If multiple results, add the highlighted one
      addToCart(filteredDishes[selectedIndex]._id);
      resetSearch();
    }
  }

  if (!filteredDishes.length) {
    const noResults = document.createElement('div');
    noResults.textContent = 'No dishes found';
    suggestionsList.appendChild(noResults);
  }
}

function handleKeyNavigation(event) {
  const suggestionsList = document.getElementById('suggestions');
  const suggestionItems = suggestionsList.querySelectorAll('.suggestion-item');

  if (!suggestionItems.length) return;

  if (event.key === 'ArrowDown') {
    selectedIndex = (selectedIndex + 1) % suggestionItems.length;
  } else if (event.key === 'ArrowUp') {
    selectedIndex = (selectedIndex - 1 + suggestionItems.length) % suggestionItems.length;
  }

  updateSuggestionsHighlight(suggestionItems);
}



function updateSuggestionsHighlight(suggestionItems) {
  suggestionItems.forEach((item, index) => {
    if (index === selectedIndex) {
      item.classList.add('highlight');
    } else {
      item.classList.remove('highlight');
    }
  });
}

function resetSearch() {
  document.getElementById('searchInput').value = '';
  document.getElementById('suggestions').innerHTML = '';
  selectedIndex = -1; // Reset index
}

// Event Listeners
document.getElementById('searchInput').addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    handleKeyNavigation(event);
  } else if (event.key === 'Enter') {
    commonSearch(event); // Handle Enter key
  }
});

document.getElementById('searchInput').addEventListener('input', debounceSearch);




// document.getElementById('salesSection').classList.remove('hidden');  // Show the sales section


// Fetch menu on page load
document.addEventListener('DOMContentLoaded', fetchMenu);

// Event listener for search input field
document.getElementById('searchInput').addEventListener('input', debounceSearch);

window.onload = () => {
  fetchCategories();
};
