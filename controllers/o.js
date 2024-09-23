// these are my routes with their req and res data

// reg (post)
//https://foodforethought-api-production.up.railway.app/api/reg/user - req body - {
  
//   "fullName": "dodo ma",
//   "email": "myfoodforethought@gmail.com",
//   "weight": 75,
//   "height": 180,
//   "age": 30,
//   "dietaryNeeds": "Vegetarian",
//   "duration": "two weeks",
//   "dislikedMeals": "rice, beans",
//   "tribe": "Yoruba",
//   "state": "Lagos",
//   "gender": "male"
// } 
// res body - {
//     "message": "A new verification email has been sent to your email address."
// }

// verify email for reg (get)
// `https://foodforethought-api-production.up.railway.app/api/verify-login?token=${token}`;
// res body - {"message":"Email verified successfully","mealPlan":{"meal_plan":{"days":[1,2,3,4,5,6,7,8,9,10,11,12,13,14],"meals":[[{"meal_name":"Yam and Egg Sauce","food_category":"Breakfast","calories_meal_intake":350,"meal_measure_gram":300,"human_equivalent_alternative_measure":"2 medium slices of yam with egg sauce"},{"meal_name":"Efo Riro with Pounded Yam","food_category":"Lunch","calories_meal_intake":600,"meal_measure_gram":400,"human_equivalent_alternative_measure":"1 serving of pounded yam with vegetable soup"},{"meal_name":"Grilled Chicken with Steamed Vegetables","food_category":"Dinner","calories_meal_intake":450,"meal_measure_gram":350,"human_equivalent_alternative_measure":"1 grilled chicken breast with mixed vegetables"}],[{"meal_name":"Akara and Pap","food_category":"Breakfast","calories_meal_intake":400,"meal_measure_gram":350,"human_equivalent_alternative_measure":"5 pieces of akara with 1 cup of pap"},{"meal_name":"Amala with Ewedu and Gbegiri","food_category":"Lunch","calories_meal_intake":550,"meal_measure_gram":450,"human_equivalent_alternative_measure":"1 serving of amala with ewedu and gbegiri soup"},{"meal_name":"Fish Pepper Soup","food_category":"Dinner","calories_meal_intake":300,"meal_measure_gram":300,"human_equivalent_alternative_measure":"1 bowl of fish pepper soup"}],[{"meal_name":"Moi Moi and Custard","food_category":"Breakfast","calories_meal_intake":350,"meal_measure_gram":300,"human_equivalent_alternative_measure":"1 serving of moi moi with custard"},{"meal_name":"Ofada Rice with Ayamase Sauce","food_category":"Lunch","calories_meal_intake":600,"meal_measure_gram":400,"human_equivalent_alternative_measure":"1 serving of ofada rice with ayamase sauce"},{"meal_name":"Grilled Fish with Salad","food_category":"Dinner","calories_meal_intake":400,"meal_measure_gram":350,"human_equivalent_alternative_measure":"1 grilled fish with mixed salad"}],[{"meal_name":"Ogi and Akamu","food_category":"Breakfast","calories_meal_intake":300,"meal_measure_gram":300,"human_equivalent_alternative_measure":"1 cup of ogi with akamu"},{"meal_name":"Eba with Egusi Soup","food_category":"Lunch","calories_meal_intake":550,"meal_measure_gram":450,"human_equivalent_alternative_measure":"1 serving of eba with egusi soup"}

// login
// https://foodforethought-api-production.up.railway.app/api/login/user req body - {
//   "email": "myfoodforethought@gmail.com",
//   "fullName": "dodo ma"
// }
// res body - {
//     "message": "Verification email sent. Please check your email to log in."
// }
// verify login (get)
// https://foodforethought-api-production.up.railway.app/api/verify-login?token=${token}
// res body -{"authtoken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im15Zm9vZGZvcmV0aG91Z2h0QGdtYWlsLmNvbSIsImlhdCI6MTcyNzA5OTA1N30.9G2dLzbT9QuqLXXh9qEvZDYRyNA9LLgA5u4y2Ew_QR0","message":"Login successful","user":{"_id":"66f12640b25e4291f3ef7fab","fullName":"John Doe","email":"myfoodforethought@gmail.com","profilePicture":"/images/default-img.jpg","weight":75,"height":180,"age":30,"dietaryNeeds":"Vegetarian","duration":"two weeks","dislikedMeals":"rice, beans","tribe":"Yoruba","state":"Lagos","gender":"male","isVerified":true,"freeMealPlans":2,"__v":0},"mealPlan":{"_id":"66f16e4f6b810602079aff5b","userId":"66f12640b25e4291f3ef7fab","duration":"two weeks","plan":{"meal_plan":{"days":[1,2,3,4,5,6,7,8,9,10,11,12,13,14],"meals":[[{"meal_name":"Yam and Egg Sauce","food_category":"Breakfast","calories_meal_intake":350,"meal_measure_gram":300,"human_equivalent_alternative_measure":"2 medium slices of yam with egg sauce"},

// get meal plans

// https://foodforethought-api-production.up.railway.app/api/get/generate-meal-plans
// p.s auth required if you want to generate plan for existing user. - Authorization Bearer <token>
// else if no auth provided, we can go ahead to use the req body
// req body -{
//   "duration": "one week",
//   "dislikedMeals": "yam, fish",
//   "age": 25,
//   "gender": "female",
//   "tribe": "Yoruba",
//   "state": "Lagos"
// }
// res body - {
    // "mealPlan": {
    //     "userId": "66f12640b25e4291f3ef7fab",
    //     "duration": "two weeks",
    //     "plan": {
    //         "meal_plan": {
    //             "days": [
    //                 1,
    //                 2,
    //                 3,
    //                 4,
    //                 5,
    //                 6,
    //                 7,
    //                 8,
    //                 9,
    //                 10,
    //                 11,
    //                 12,
    //                 13,
    //                 14
    //             ],
    //             "meals": [
    //                 [
    //                     {
    //                         "meal_name": "Yam and Egg Sauce",
    //                         "food_category": "Breakfast",
    //                         "calories_meal_intake": 350,
    //                         "meal_measure_gram": 300,
    //                         "human_equivalent_alternative_measure": "2 medium yams and 2 eggs"
    //                     },
    //                     {
    //                         "meal_name": "Efo Riro with Pounded Yam",
    //                         "food_category": "Lunch",
    //                         "calories_meal_intake": 600,
    //                         "meal_measure_gram": 400,
    //                         "human_equivalent_alternative_measure": "1 cup of pounded yam and 1 cup of Efo Riro"
    //                     },

    // get past meal plans
    // https://foodforethought-api-production.up.railway.app/api/get/past-plans (get)
    // Authorization token needed
    // res - [
    // {
    //     "_id": "66f16e4f6b810602079aff5b",
    //     "userId": "66f12640b25e4291f3ef7fab",
    //     "duration": "two weeks",
    //     "plan": {
    //         "meal_plan": {
    //             "days": [
    //                 1,
    //                 2,
    //                 3,
    //                 4,
    //                 5,
    //                 6,
    //                 7,
    //                 8,
    //                 9,
    //                 10,
    //                 11,
    //                 12,
    //                 13,
    //                 14
    //             ],
    //             "meals": [
    //                 [
    //                     {
    //                         "meal_name": "Yam and Egg Sauce",
    //                         "food_category": "Breakfast",
    //                         "calories_meal_intake": 350,
    //                         "meal_measure_gram": 300,
    //                         "human_equivalent_alternative_measure": "2 medium slices of yam with egg sauce"
    //                     },
    //                     {
    //                         "meal_name": "Efo Riro with Pounded Yam",
    //                         "food_category": "Lunch",
    //                         "calories_meal_intake": 600,
    //                         "meal_measure_gram": 400,
    //                         "human_equivalent_alternative_measure": "1 medium serving of pounded yam with vegetable soup"
    //                     },
    //                     {
    //                         "meal_name": "Grilled Chicken with Steamed Vegetables",
    //                         "food_category": "Dinner",
    //                         "calories_meal_intake": 450,
    //                         "meal_measure_gram": 350,
    //                         "human_equivalent_alternative_measure": "1 chicken breast with mixed vegetables"
    //                     }
    //                 ],
    //                 [
    //                     {
    //                         "meal_name": "Akara and Pap",
    //                         "food_category": "Breakfast",
    //                         "calories_meal_intake": 300,
    //                         "meal_measure_gram": 250,
    //                         "human_equivalent_alternative_measure": "5 pieces of akara with 1 cup of pap"
    //                     },
    //                     {
    //                         "meal_name": "Amala with Ewedu and Gbegiri",
    //                         "food_category": "Lunch",
    //                         "calories_meal_intake": 550,
    //                         "meal_measure_gram": 450,
    //                         "human_equivalent_alternative_measure": "1 medium serving of amala with ewedu and gbegiri soup"
    //                     },
    //                     {
    //                         "meal_name": "Fish Pepper Soup",
    //                         "food_category": "Dinner",
    //                         "calories_meal_intake": 400,
    //                         "meal_measure_gram": 300,
    //                         "human_equivalent_alternative_measure": "1 bowl of fish pepper soup"
    //                     }
    //                 ],

    // edit user 
//     // https://foodforethought-api-production.up.railway.app/api/update/user req body {
//   "fullName": "ifeanyi nwogu",
//   "age": 30,
//   "state": "California",
//   "dislikedMeals": "yam, fish"
// }
// Authorization token needed
// res body - {
//     "message": "User updated successfully",
//     "user": {
//         "fullName": "ifeanyi nwogu",
//         "email": "myfoodforethought@gmail.com",
//         "weight": 75,
//         "height": 180,
//         "age": 30,
//         "dietaryNeeds": "Vegetarian",
//         "dislikedMeals": "yam, fish",
//         "duration": "two weeks",
//         "tribe": "Yoruba",
//         "state": "California",
//         "gender": "male"
//     }
// }