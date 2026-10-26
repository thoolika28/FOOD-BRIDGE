
document.addEventListener("DOMContentLoaded", function () {
    const pages = document.querySelectorAll("[data-view]");
    const menuToggle = document.getElementById("menu-toggle");
    const navLinks = document.getElementById("nav-links");
    const themeToggle = document.getElementById("theme-toggle");

    const donationForm = document.getElementById("donation-form");
    const donorStatus = document.getElementById("donor-status");
    const buyerForm = document.getElementById("buyer-form");
    const buyerStatus = document.getElementById("buyer-status");

    const foodList = document.getElementById("food-list");
    const foodSearch = document.getElementById("food-search");
    const categoryFilter = document.getElementById("category-filter");
    const pickupInput = document.getElementById("pickup-time");

    // POPUP NOTIFICATIONS

    let toastTimer;

    function showToast(message, success) {
        let toast = document.getElementById("food-bridge-toast");

        if (!toast) {
            toast = document.createElement("div");
            toast.id = "food-bridge-toast";
            toast.setAttribute("role", "status");
            toast.setAttribute("aria-live", "polite");

            Object.assign(toast.style, {
                position: "fixed",
                top: "24px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "max-content",
                maxWidth: "90%",
                padding: "15px 22px",
                borderRadius: "12px",
                background: "#301719",
                color: "#f5e8d0",
                border: "1px solid #d5b36c",
                boxShadow: "0 8px 28px rgba(0,0,0,0.3)",
                fontSize: "14px",
                lineHeight: "1.5",
                textAlign: "center",
                zIndex: "99999",
                opacity: "0",
                transition: "opacity 0.25s ease"
            });

            document.body.appendChild(toast);
        }

        toast.style.borderColor = success ? "#d5b36c" : "#d88b80";
        toast.textContent = message;
        toast.style.opacity = "1";

        clearTimeout(toastTimer);

        toastTimer = setTimeout(function () {
            toast.style.opacity = "0";
        }, 3500);
    }


    // PAGE NAVIGATION

    function showPage(pageName, scrollTarget) {
        const validPages = ["home", "donor", "buyer"];

        if (!validPages.includes(pageName)) {
            pageName = "home";
        }

        pages.forEach(function (page) {
            const isActive = page.dataset.view === pageName;
            page.hidden = !isActive;
            page.classList.toggle("active", isActive);
        });

        if (navLinks) {
            navLinks.classList.remove("open");
        }

        if (menuToggle) {
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation");
        }

        if (scrollTarget && pageName === "home") {
            requestAnimationFrame(function () {
                const target = document.getElementById(scrollTarget);

                if (target) {
                    target.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }
            });
        } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }

    document.querySelectorAll("[data-page]").forEach(function (button) {
        button.addEventListener("click", function (event) {
            event.preventDefault();

            showPage(
                button.dataset.page,
                button.dataset.scroll || ""
            );
        });
    });

    document.querySelectorAll("[data-scroll]").forEach(function (button) {
        if (button.hasAttribute("data-page")) return;

        button.addEventListener("click", function () {
            const target = document.getElementById(button.dataset.scroll);

            if (target) {
                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });
    });


    // MOBILE MENU

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", function () {
            const isOpen = navLinks.classList.toggle("open");

            menuToggle.setAttribute("aria-expanded", String(isOpen));
            menuToggle.setAttribute(
                "aria-label",
                isOpen ? "Close navigation" : "Open navigation"
            );
        });
    }


    // DARK / LIGHT THEME

    let savedTheme = "dark";

    try {
        savedTheme = localStorage.getItem("foodBridgeTheme") || "dark";
    } catch (error) {
        savedTheme = "dark";
    }

    if (savedTheme === "light") {
        document.body.classList.add("light-mode");
    }

    function updateThemeButton() {
        if (!themeToggle) return;

        const isLight = document.body.classList.contains("light-mode");

        themeToggle.textContent = isLight ? "DARK" : "LIGHT";
        themeToggle.setAttribute(
            "aria-label",
            isLight ? "Switch to dark theme" : "Switch to light theme"
        );
    }

    updateThemeButton();

    if (themeToggle) {
        themeToggle.addEventListener("click", function () {
            document.body.classList.toggle("light-mode");

            const theme = document.body.classList.contains("light-mode")
                ? "light"
                : "dark";

            try {
                localStorage.setItem("foodBridgeTheme", theme);
            } catch (error) {
                // Theme switching still works without storage.
            }

            updateThemeButton();
        });
    }


    // LOAD DONATIONS

    let donations = [];

    try {
        const savedDonations = localStorage.getItem("foodBridgeDonations");

        if (savedDonations) {
            const parsed = JSON.parse(savedDonations);

            if (Array.isArray(parsed)) {
                donations = parsed;
            }
        }
    } catch (error) {
        donations = [];
    }


    // PICKUP DATE VALIDATION

    function setPickupMinimum() {
        if (!pickupInput) return;

        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());

        pickupInput.min = now.toISOString().slice(0, 16);
    }

    setPickupMinimum();


    // ORDER FORM POPUP

    function openOrderForm(donation) {
        const availableDonation = donations.find(function (item) {
            return item.id === donation.id;
        });

        if (!availableDonation) {
            showToast("This food listing is no longer available.", false);
            renderDonations();
            return;
        }

        const availableQuantity = Number(availableDonation.quantity);

        if (!Number.isFinite(availableQuantity) || availableQuantity < 1) {
            showToast("There are no servings left for this listing.", false);
            renderDonations();
            return;
        }

        // Create the popup without changing index.html.

        const overlay = document.createElement("div");
        overlay.id = "food-order-overlay";

        Object.assign(overlay.style, {
            position: "fixed",
            inset: "0",
            background: "rgba(15, 7, 8, 0.78)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "18px",
            zIndex: "99998",
            overflowY: "auto"
        });

        const modal = document.createElement("div");

        Object.assign(modal.style, {
            width: "100%",
            maxWidth: "430px",
            maxHeight: "90vh",
            overflowY: "auto",
            boxSizing: "border-box",
            padding: "26px",
            borderRadius: "16px",
            background: "#301719",
            color: "#f5e8d0",
            border: "1px solid #d5b36c",
            boxShadow: "0 15px 50px rgba(0,0,0,0.4)",
            fontFamily: "inherit"
        });

        const heading = document.createElement("h2");
        heading.textContent = "Order Food";
        heading.style.marginTop = "0";
        heading.style.color = "#e2c27c";

        const foodTitle = document.createElement("p");
        foodTitle.textContent = donation.foodName;
        foodTitle.style.fontWeight = "bold";
        foodTitle.style.fontSize = "18px";

        const remaining = document.createElement("p");
        remaining.textContent = "Available servings: " + availableQuantity;
        remaining.style.color = "#e2c27c";

        const form = document.createElement("form");

        function createField(labelText, id, type, placeholder) {
            const wrapper = document.createElement("div");
            wrapper.style.marginBottom = "16px";

            const label = document.createElement("label");
            label.htmlFor = id;
            label.textContent = labelText;
            label.style.display = "block";
            label.style.marginBottom = "7px";
            label.style.fontSize = "14px";

            const input = document.createElement("input");
            input.id = id;
            input.name = id;
            input.type = type;
            input.placeholder = placeholder || "";
            input.required = true;

            Object.assign(input.style, {
                display: "block",
                width: "100%",
                minWidth: "0",
                boxSizing: "border-box",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #9b8050",
                background: "#f8edda",
                color: "#301719",
                fontSize: "14px"
            });

            wrapper.appendChild(label);
            wrapper.appendChild(input);
            form.appendChild(wrapper);

            return input;
        }

        const buyerName = createField(
            "Your name",
            "order-buyer-name",
            "text",
            "Enter your full name"
        );

        const buyerContact = createField(
            "Contact number",
            "order-buyer-contact",
            "tel",
            "Enter your phone number"
        );

        const servings = createField(
            "Number of servings you need",
            "order-servings",
            "number",
            "Maximum: " + availableQuantity
        );

        servings.min = "1";
        servings.max = String(availableQuantity);
        servings.step = "1";
        servings.inputMode = "numeric";

        const pickupNote = document.createElement("p");
        pickupNote.textContent =
            "Pickup location: " + donation.location +
            ". Please coordinate pickup with the donor.";
        pickupNote.style.fontSize = "13px";
        pickupNote.style.lineHeight = "1.6";
        pickupNote.style.color = "#d8c6ac";
        form.appendChild(pickupNote);

        const buttonRow = document.createElement("div");

        Object.assign(buttonRow.style, {
            display: "flex",
            gap: "10px",
            marginTop: "20px",
            flexWrap: "wrap"
        });

        const cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.textContent = "Cancel";

        const submitButton = document.createElement("button");
        submitButton.type = "submit";
        submitButton.textContent = "Confirm Order";

        [cancelButton, submitButton].forEach(function (button) {
            Object.assign(button.style, {
                flex: "1",
                padding: "12px 14px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold"
            });
        });

        Object.assign(cancelButton.style, {
            background: "transparent",
            color: "#f5e8d0",
            border: "1px solid #9b8050"
        });

        Object.assign(submitButton.style, {
            background: "#d5b36c",
            color: "#301719",
            border: "1px solid #d5b36c"
        });

        buttonRow.appendChild(cancelButton);
        buttonRow.appendChild(submitButton);

        form.appendChild(buttonRow);

        modal.appendChild(heading);
        modal.appendChild(foodTitle);
        modal.appendChild(remaining);
        modal.appendChild(form);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        cancelButton.addEventListener("click", function () {
            overlay.remove();
        });

        overlay.addEventListener("click", function (event) {
            if (event.target === overlay) {
                overlay.remove();
            }
        });

        function handleEscape(event) {
            if (event.key === "Escape") {
                overlay.remove();
                document.removeEventListener("keydown", handleEscape);
            }
        }

        document.addEventListener("keydown", handleEscape);

        overlay.addEventListener("remove", function () {
            document.removeEventListener("keydown", handleEscape);
        });

        buyerName.focus();

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            const name = buyerName.value.trim();
            const contact = buyerContact.value.trim();
            const requestedServings = Number(servings.value);

            if (!name || !contact) {
                showToast("Please enter your name and contact number.", false);
                return;
            }

            if (!/^[0-9+()\-\s]{7,20}$/.test(contact)) {
                showToast("Please enter a valid contact number.", false);
                buyerContact.focus();
                return;
            }

            if (
                !Number.isInteger(requestedServings) ||
                requestedServings < 1
            ) {
                showToast("Enter a valid number of servings.", false);
                servings.focus();
                return;
            }

            // Recheck availability before saving the order.

            const currentDonation = donations.find(function (item) {
                return item.id === donation.id;
            });

            if (
                !currentDonation ||
                requestedServings > Number(currentDonation.quantity)
            ) {
                overlay.remove();
                showToast(
                    "Not enough servings remain. Please check the updated listing.",
                    false
                );
                renderDonations();
                return;
            }

            const confirmed = window.confirm(
                "Confirm your order?\n\n" +
                "Food: " + currentDonation.foodName + "\n" +
                "Servings: " + requestedServings + "\n" +
                "Name: " + name + "\n\n" +
                "Please verify your details before continuing."
            );

            if (!confirmed) return;

            let orders = [];

            try {
                const savedOrders = JSON.parse(
                    localStorage.getItem("foodBridgeOrders") || "[]"
                );

                if (Array.isArray(savedOrders)) {
                    orders = savedOrders;
                }
            } catch (error) {
                showToast("Could not load previous orders.", false);
                return;
            }

            const order = {
                orderId: Date.now().toString(),
                donationId: currentDonation.id,
                foodName: currentDonation.foodName,
                servings: requestedServings,
                buyerName: name,
                buyerContact: contact,
                donorName: currentDonation.donorName,
                donorContact: currentDonation.donorContact,
                pickupTime: currentDonation.pickupTime,
                location: currentDonation.location,
                orderedAt: new Date().toISOString(),
                status: "Requested"
            };

            const previousDonations = donations.map(function (item) {
                return Object.assign({}, item);
            });

            const previousOrders = localStorage.getItem("foodBridgeOrders");

            // Subtract only the servings requested by the buyer.

            currentDonation.quantity =
                Number(currentDonation.quantity) - requestedServings;

            if (currentDonation.quantity === 0) {
                donations = donations.filter(function (item) {
                    return item.id !== currentDonation.id;
                });
            }

            orders.push(order);

            try {
                localStorage.setItem(
                    "foodBridgeDonations",
                    JSON.stringify(donations)
                );

                localStorage.setItem(
                    "foodBridgeOrders",
                    JSON.stringify(orders)
                );
            } catch (error) {
                donations = previousDonations;

                try {
                    localStorage.setItem(
                        "foodBridgeDonations",
                        JSON.stringify(donations)
                    );

                    if (previousOrders === null) {
                        localStorage.removeItem("foodBridgeOrders");
                    } else {
                        localStorage.setItem(
                            "foodBridgeOrders",
                            previousOrders
                        );
                    }
                } catch (restoreError) {
                    // Browser storage may be unavailable.
                }

                showToast(
                    "Could not save the order. Please try again.",
                    false
                );
                return;
            }

            overlay.remove();
            renderDonations();
            updateImpact();

            showToast(
                "Order placed successfully for " +
                requestedServings + " serving(s)!",
                true
            );
        });
    }


    // RENDER FOOD LISTINGS

    function renderDonations() {
        if (!foodList) return;

        foodList.replaceChildren();

        const searchTerm = foodSearch
            ? foodSearch.value.trim().toLowerCase()
            : "";

        const selectedCategory = categoryFilter
            ? categoryFilter.value
            : "";

        const availableDonations = donations.filter(function (donation) {
            if (
                !donation ||
                typeof donation.foodName !== "string" ||
                typeof donation.foodType !== "string" ||
                typeof donation.pickupTime !== "string"
            ) {
                return false;
            }

            const pickupDate = new Date(donation.pickupTime).getTime();

            return Number.isFinite(pickupDate) &&
                pickupDate > Date.now() &&
                Number(donation.quantity) > 0 &&
                donation.foodName.toLowerCase().includes(searchTerm) &&
                (!selectedCategory ||
                    donation.foodType === selectedCategory);
        });

        if (availableDonations.length === 0) {
            const message = document.createElement("p");
            message.className = "empty-message";
            message.textContent = donations.length === 0
                ? "No food donations are listed yet."
                : "No available donations match your search.";

            foodList.appendChild(message);
            return;
        }

        availableDonations.forEach(function (donation) {
            const card = document.createElement("article");
            card.className = "food-item";

            const category = document.createElement("span");
            category.className = "food-category";
            category.textContent = donation.foodType;

            const title = document.createElement("h3");
            title.textContent = donation.foodName;

            const quantity = document.createElement("p");
            quantity.textContent =
                "Available servings: " + donation.quantity;

            const donor = document.createElement("p");
            donor.textContent = "Donor: " + donation.donorName;

            const pickup = document.createElement("p");
            pickup.textContent = "Pickup deadline: " +
                new Date(donation.pickupTime).toLocaleString();

            const address = document.createElement("p");
            address.textContent = "Pickup address: " + donation.location;

            const orderButton = document.createElement("button");
            orderButton.type = "button";
            orderButton.className = "order-food-button";
            orderButton.textContent = "Order Food";

            Object.assign(orderButton.style, {
                marginTop: "12px",
                padding: "11px 20px",
                border: "1px solid rgba(213, 179, 108, 0.7)",
                borderRadius: "8px",
                background: "#d5b36c",
                color: "#301719",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background 0.2s ease"
            });

            orderButton.addEventListener("mouseenter", function () {
                orderButton.style.background = "#f0d9a2";
            });

            orderButton.addEventListener("mouseleave", function () {
                orderButton.style.background = "#d5b36c";
            });

            orderButton.addEventListener("click", function () {
                openOrderForm(donation);
            });

            card.appendChild(category);
            card.appendChild(title);
            card.appendChild(quantity);
            card.appendChild(donor);
            card.appendChild(pickup);
            card.appendChild(address);
            card.appendChild(orderButton);

            foodList.appendChild(card);
        });
    }

    if (foodSearch) {
        foodSearch.addEventListener("input", renderDonations);
    }

    if (categoryFilter) {
        categoryFilter.addEventListener("change", renderDonations);
    }


    // PUBLISH DONATION

    if (donationForm) {
        donationForm.addEventListener("submit", function (event) {
            event.preventDefault();

            if (!donationForm.reportValidity()) return;

            const donorName =
                document.getElementById("donor-name").value.trim();

            const donorContact =
                document.getElementById("donor-contact").value.trim();

            const foodName =
                document.getElementById("food-name").value.trim();

            const quantity =
                Number(document.getElementById("food-quantity").value);

            const foodType =
                document.getElementById("food-type").value;

            const pickupTime =
                document.getElementById("pickup-time").value;

            const location =
                document.getElementById("donor-location").value.trim();

            if (
                !donorName ||
                !donorContact ||
                !foodName ||
                !foodType ||
                !location
            ) {
                if (donorStatus) {
                    donorStatus.textContent =
                        "Please complete all required fields.";
                }

                showToast("Please complete all required fields.", false);
                return;
            }

            if (!Number.isFinite(quantity) || quantity < 1) {
                if (donorStatus) {
                    donorStatus.textContent =
                        "Please enter a valid quantity.";
                }

                showToast("Please enter a valid quantity.", false);
                return;
            }

            if (new Date(pickupTime).getTime() <= Date.now()) {
                if (donorStatus) {
                    donorStatus.textContent =
                        "Please select a future pickup deadline.";
                }

                showToast(
                    "Please select a future pickup deadline.",
                    false
                );
                return;
            }

            const donation = {
                id: Date.now().toString(),
                donorName: donorName,
                donorContact: donorContact,
                foodName: foodName,
                quantity: quantity,
                foodType: foodType,
                pickupTime: pickupTime,
                location: location
            };

            const previousDonations = donations.slice();
            donations.unshift(donation);

            try {
                localStorage.setItem(
                    "foodBridgeDonations",
                    JSON.stringify(donations)
                );
            } catch (error) {
                donations = previousDonations;

                if (donorStatus) {
                    donorStatus.textContent =
                        "Could not save the listing in this browser.";
                }

                showToast(
                    "Could not save the food listing. Please try again.",
                    false
                );
                return;
            }

            donationForm.reset();
            setPickupMinimum();
            renderDonations();
            updateImpact();

            if (donorStatus) {
                donorStatus.textContent =
                    "Food has been added to the list successfully!";
            }

            showToast(
                "Food has been added to the list successfully!",
                true
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }


    // IMPACT COUNTERS

    function updateImpact() {
        const activeDonations = donations.filter(function (donation) {
            if (!donation || !donation.pickupTime) return false;

            const pickupDate = new Date(donation.pickupTime).getTime();

            return Number.isFinite(pickupDate) && pickupDate > Date.now();
        });

        const totalMeals = activeDonations.reduce(function (total, donation) {
            return total +
                Math.max(0, Number(donation.quantity) || 0);
        }, 0);

        const donorNames = new Set(
            activeDonations.map(function (donation) {
                return String(donation.donorName || "")
                    .trim()
                    .toLowerCase();
            }).filter(Boolean)
        );

        const mealsCount = document.getElementById("meals-count");
        const donationsCount = document.getElementById("donations-count");
        const peopleCount = document.getElementById("people-count");

        if (mealsCount) {
            mealsCount.textContent = totalMeals.toLocaleString();
        }

        if (donationsCount) {
            donationsCount.textContent =
                activeDonations.length.toLocaleString();
        }

        if (peopleCount) {
            peopleCount.textContent = donorNames.size.toLocaleString();
        }
    }


    // BUYER FOOD REQUEST FORM

    if (buyerForm) {
        buyerForm.addEventListener("submit", function (event) {
            event.preventDefault();

            if (!buyerForm.reportValidity()) return;

            const buyerName =
                document.getElementById("buyer-name").value.trim();

            const buyerType =
                document.getElementById("buyer-type").value;

            const buyerEmail =
                document.getElementById("buyer-email").value.trim();

            const buyerContact =
                document.getElementById("buyer-contact").value.trim();

            const peopleCount =
                Number(document.getElementById("people-count").value);

            const servingsNeeded =
                Number(document.getElementById("servings-needed").value);

            const requestedFoodType =
                document.getElementById("requested-food-type").value;

            const dietaryNeeds =
                document.getElementById("dietary-needs").value;

            const requiredDate =
                document.getElementById("required-date").value;

            const collectionTime =
                document.getElementById("collection-time").value;

            const buyerAddress =
                document.getElementById("buyer-address").value.trim();

            const buyerNotes =
                document.getElementById("buyer-notes").value.trim();

            if (
                !buyerName ||
                !buyerType ||
                !buyerEmail ||
                !buyerContact ||
                !requestedFoodType ||
                !requiredDate ||
                !collectionTime ||
                !buyerAddress
            ) {
                showToast("Please complete all required fields.", false);
                return;
            }

            if (
                !Number.isInteger(peopleCount) ||
                peopleCount < 1 ||
                !Number.isInteger(servingsNeeded) ||
                servingsNeeded < 1
            ) {
                showToast(
                    "Enter valid numbers for people and servings.",
                    false
                );
                return;
            }

            if (!/^[0-9+()\-\s]{7,20}$/.test(buyerContact)) {
                showToast("Please enter a valid contact number.", false);
                return;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const selectedDate = new Date(requiredDate + "T00:00:00");

            if (
                !Number.isFinite(selectedDate.getTime()) ||
                selectedDate < today
            ) {
                showToast(
                    "Please select today or a future date.",
                    false
                );
                return;
            }

            const request = {
                requestId: Date.now().toString(),
                buyerName: buyerName,
                buyerType: buyerType,
                buyerEmail: buyerEmail,
                buyerContact: buyerContact,
                peopleCount: peopleCount,
                servingsNeeded: servingsNeeded,
                requestedFoodType: requestedFoodType,
                dietaryNeeds: dietaryNeeds,
                requiredDate: requiredDate,
                collectionTime: collectionTime,
                buyerAddress: buyerAddress,
                buyerNotes: buyerNotes,
                submittedAt: new Date().toISOString(),
                status: "Pending"
            };

            let requests = [];

            try {
                const savedRequests = JSON.parse(
                    localStorage.getItem("foodBridgeRequests") || "[]"
                );

                if (Array.isArray(savedRequests)) {
                    requests = savedRequests;
                }

                requests.push(request);

                localStorage.setItem(
                    "foodBridgeRequests",
                    JSON.stringify(requests)
                );
            } catch (error) {
                showToast(
                    "Could not save your request. Please try again.",
                    false
                );
                return;
            }

            buyerForm.reset();

            if (buyerStatus) {
                buyerStatus.textContent =
                    "Your food request has been submitted successfully!";
            }

            showToast(
                "Food request submitted successfully!",
                true
            );
        });
    }

    // INITIALISE

    renderDonations();
    updateImpact();

    console.log("Food Bridge loaded successfully.");
});
