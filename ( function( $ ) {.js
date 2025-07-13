( function( $ ) {
	var PAYPAL_CLIENT_ID  = "AUvID9mMhBpneniAARxaLDxCmz7av_4uYSesZuJzWR5AsVFUL2lJvO8D6VyX0FLubyCx1QcyazrnLa0r";
	var PAYPAL_APP_SECRET = "EGBLxl9bfxHtkjR-2EE6mcMCmPrOaRsJktHNdL9Ui9icm2XPBsCctehj1j-umeRjIwdQsRycMfggqBk6";
	var PAYPAL_PAYMENT_MODE = "test";
	var PAYPAL_URL = "https://api-m.sandbox.paypal.com";
	var resultContainer = $('#paymentResponse');    

	// Function to get OAuth token
	async function getPayPalAccessToken() {
	    const response = await fetch(PAYPAL_URL + "/v1/oauth2/token", {
	        method: 'POST',
	        headers: {
	            'Content-Type': 'application/x-www-form-urlencoded',
	            'Authorization': 'Basic ' + btoa(PAYPAL_CLIENT_ID + ':' + PAYPAL_APP_SECRET)
	        },
	        body: 'grant_type=client_credentials&response_type=id_token'
	    });
	    const data = await response.json();
	    return data.access_token;
	}

	// Function to get headers with Bearer token
	async function getPayPalHeaders() {
	    const accessToken = await getPayPalAccessToken();
	    return new Headers({
	        'Content-Type': 'application/json',
	        'Authorization': `Bearer ${accessToken}`,
	    });
	}

	paypal.Buttons({
		style: {
            color: 'blue',
            height: 55,
        },
        async createOrder() {
            const headers = await getPayPalHeaders();
            return fetch(PAYPAL_URL + "/v2/checkout/orders", {
                method: "post",
                headers: headers,
                body: JSON.stringify({
                    "intent": "CAPTURE",
                    "payment_source": {
                        "paypal": {
                          "attributes": {
                            "vault": {
                              "store_in_vault": "ON_SUCCESS",
                              "usage_type": "MERCHANT"
                            }
                          },
                          "experience_context": {
                            "return_url": "https://example.com/returnUrl",
                            "cancel_url": "https://example.com/cancelUrl"
                        }
                      }
                    },
                    "purchase_units": [
                        {
                            "items": [
                                {
                                    "name": 'Test Product',
                                    "quantity": "1",
                                    "unit_amount": {
                                        "currency_code": "USD",
                                        "value": "10.00"
                                    }
                                }
                            ],
                            "amount": {
                                "currency_code": "USD",
                                "value": "10.00",
                                "breakdown": {
                                    "item_total": {
                                        "currency_code": "USD",
                                        "value": "10.00"
                                    }
                                }
                            }
                        }
                    ]
                })
            })
            .then((response) => response.json())
            .then((order) => order.id)
            .catch(error => { 
                console.error('Error:', error);
                resultContainer.html('<p class="wpf_form_notices wpf_form_notice_error">Error while creating order!</p>'); 
            });
        },
        async onApprove(data) {
            console.log(data);
            const headers = await getPayPalHeaders();
            return fetch(PAYPAL_URL + "/v2/checkout/orders/" + data.orderID + "/capture", {
                method: "post",
                headers: headers,
            })
            .then(response => response.json())
            .then(orderData => { 
                console.log(orderData);
                if (orderData.status === "COMPLETED") {
                    // Extract payment source ID (vault ID)
                    const paymentSourceId = orderData.payment_source.paypal.attributes.vault.id;
					console.log(paymentSourceId);
					console.log(orderData);
                    // Send to your backend
                    return $.ajax({
                        url: 'https://wordpressdemo.project-demo.info/wp-admin/admin-ajax.php',
                        type: 'post',
                        data: {
                            action: 'save_paypal_vault',
                            payment_source_id: paymentSourceId,
                            customer_email: orderData.payer.email_address,
                            customer_name: orderData.payer.name.given_name + ' ' + orderData.payer.name.surname,
                            order_id: data.orderID
                        }
                    });
                }
                throw new Error('Payment not completed');
            })
            .then(response => {
                resultContainer.html('<p class="wpf_form_notices wpf_form_notice_success">Payment successful and vault ID saved!</p>');
            })
            .catch(error => { 
                resultContainer.html('<p class="wpf_form_notices wpf_form_notice_error">Error while capturing payment!</p>'); 
            });
        }
    }).render('#paypal-button-container');

}( jQuery ) );