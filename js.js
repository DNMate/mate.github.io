document.addEventListener("DOMContentLoaded", function() {
  // Ha nincs elmentett felhasználónév, kérjük be a modál segítségével.
  let userName = localStorage.getItem("userName");
  if (!userName) {
    showNameModal();
  } else {
    updateUserName(userName);
  }
  
  // Navigáció, hozzávaló sorok inicializálása és adatok megjelenítése.
  setUpNavigation();
  initializeIngredientsRows();
  displayAllRecipes();
  displaySourceList();
  displayFavorites();
  
  // Új recept űrlap beküldésének eseménykezelése.
  document.getElementById("newRecipeForm").addEventListener("submit", function(e) {
    e.preventDefault();
    saveRecipeForm();
  });
  
  // Kuka ikon: törli a file input tartalmát.
  document.getElementById("clearImage").addEventListener("click", function(){
    clearSelectedImage();
  });
  
  // A file input változás eseményére meghívjuk a displayImagePreview()-t.
  document.getElementById("recipeImage").addEventListener("change", function(){
    displayImagePreview(this);
  });
});


/* ========= FELUGRÓ NEVBEKÉRŐ MODAL ========= */
function showNameModal() {
  document.getElementById("namePrompt").style.display = "flex";
}

function submitUserName() {
  let name = document.getElementById("customUserName").value.trim();
  if(name === "") {
    alert("Kérlek, add meg a neved!");
    return;
  }
  localStorage.setItem("userName", name);
  updateUserName(name);
  document.getElementById("namePrompt").style.display = "none";
}

function updateUserName(name) {
  document.getElementById("userNameTitle").innerText = name;
  document.getElementById("welcomeUser").innerText = name;
}

// A "Név módosítása" gomb meghívja ezt a függvényt, ami megnyitja a modált.
function changeUserName() {
  showNameModal();
}


/* ========= NAVIGÁCIÓ ========= */
function setUpNavigation() {
  const navItems = document.querySelectorAll("nav ul li");
  navItems.forEach(item => {
    item.addEventListener("click", function(){
      const target = this.getAttribute("data-page");
      showPage(target);
    });
  });
}

function showPage(pageId) {
  const pages = document.querySelectorAll(".page");
  pages.forEach(page => {
    page.style.display = "none";
  });
  document.getElementById(pageId).style.display = "block";
  
  if(pageId === "myRecipes") { displayAllRecipes(); }
  if(pageId === "fromWho") { displaySourceList(); }
  if(pageId === "favorites") { displayFavorites(); }
}


/* ========= RECEPTEK LOCALSTORAGE KEZELÉSE ========= */
function getRecipes() {
  let recipes = localStorage.getItem("recipes");
  if(recipes) return JSON.parse(recipes);
  return [];
}

function saveRecipes(recipes) {
  localStorage.setItem("recipes", JSON.stringify(recipes));
}


/* ========= HOZZÁVALÓ SOROK ========= */
function initializeIngredientsRows() {
  const container = document.getElementById("ingredientsContainer");
  container.innerHTML = "";
  // Alapértelmezett 3 sor létrehozása.
  for (let i = 0; i < 3; i++){
    addIngredientRow();
  }
}

document.getElementById("addIngredientRow").addEventListener("click", function(){
  addIngredientRow();
});

function addIngredientRow(quantity = "", unit = "", ingredient = "") {
  const container = document.getElementById("ingredientsContainer");
  const row = document.createElement("div");
  row.className = "ingredient-row";
  
  // Három input: mennyiség (15%), mértékegység (15%), hozzávaló (70%).
  const qtyInput = document.createElement("input");
  qtyInput.type = "text";
  qtyInput.placeholder = "Mennyiség";
  qtyInput.value = quantity;
  row.appendChild(qtyInput);
  
  const unitInput = document.createElement("input");
  unitInput.type = "text";
  unitInput.placeholder = "Mértékegység";
  unitInput.value = unit;
  row.appendChild(unitInput);
  
  const ingredientInput = document.createElement("input");
  ingredientInput.type = "text";
  ingredientInput.placeholder = "Hozzávaló";
  ingredientInput.value = ingredient;
  row.appendChild(ingredientInput);
  
  container.appendChild(row);
}


/* ========= FILE INPUT TÖRLÉSE ========= */
function clearSelectedImage() {
  const fileInput = document.getElementById("recipeImage");
  fileInput.value = "";
  const preview = document.getElementById("imagePreviewContainer");
  preview.innerHTML = "";
  preview.style.display = "none";
}


/* ========= KÉP ELŐNÉZET MEGJELENÍTÉSE ========= */
// A függvény úgy működik, hogy:
// - Szerkesztési módban (ha a form rendelkezik data-editing attribútummal) a kiválasztott kép előnézete
//   azonnal megjelenik, fix méretben: 6cm széles, 4cm magas.
// - Új recept felvételnél (nincs data-editing) a kép előnézete nem látszik.
function displayImagePreview(input) {
  const previewContainer = document.getElementById("imagePreviewContainer");
  if(document.getElementById("newRecipeForm").hasAttribute("data-editing")) {
    previewContainer.innerHTML = "";
    if(input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = document.createElement("img");
        img.src = e.target.result;
        img.style.width = "6cm";
        img.style.height = "4cm";
        img.style.objectFit = "cover";
        previewContainer.appendChild(img);
        previewContainer.style.display = "block";
      };
      reader.readAsDataURL(input.files[0]);
    }
  } else {
    previewContainer.innerHTML = "";
    previewContainer.style.display = "none";
  }
}


/* ========= ÚJ RECEPTEK MENTÉSE ========= */
function saveRecipeForm() {
  const title = document.getElementById("recipeTitle").value.trim();
  const prepTime = document.getElementById("prepTime").value.trim();
  const source = document.getElementById("recipeSource").value.trim();
  const preparation = document.getElementById("preparation").value.trim();
  
  // Kötelező mezők ellenőrzése.
  if(title === "" || prepTime === "" || preparation === ""){
    alert("Kérlek töltsd ki a kötelező mezőket!");
    return;
  }
  
  const imageInput = document.getElementById("recipeImage");
  const reader = new FileReader();
  reader.onload = function() {
    const imageData = reader.result;
    // Hozzávalók beolvasása.
    const ingContainer = document.getElementById("ingredientsContainer");
    const rows = ingContainer.getElementsByClassName("ingredient-row");
    let ingredients = [];
    for(let row of rows) {
      const inputs = row.getElementsByTagName("input");
      const qty = inputs[0].value.trim();
      const unit = inputs[1].value.trim();
      const ing = inputs[2].value.trim();
      if(qty || unit || ing) {
        ingredients.push({qty, unit, ing});
      }
    }
    
    // Új recept vagy szerkesztés logikája.
    const recipeId = "recipe_" + Date.now();
    let editingId = document.getElementById("newRecipeForm").getAttribute("data-editing");
    let recipes = getRecipes();
    if(editingId) {
      const index = recipes.findIndex(r => r.id === editingId);
      if(index > -1){
        recipes[index] = {
          id: editingId,
          title: title,
          image: imageData || "",
          prepTime: prepTime,
          source: source,
          ingredients: ingredients,
          preparation: preparation,
          favorite: recipes[index].favorite || false
        };
      }
      document.getElementById("newRecipeForm").removeAttribute("data-editing");
      alert("Recept frissítve!");
    } else {
      const recipe = {
          id: recipeId,
          title: title,
          image: imageData || "",
          prepTime: prepTime,
          source: source,
          ingredients: ingredients,
          preparation: preparation,
          favorite: false
      };
      recipes.push(recipe);
      alert("Recept mentve!");
    }
    saveRecipes(recipes);
    document.getElementById("newRecipeForm").reset();
    initializeIngredientsRows();
    clearSelectedImage();
    showPage("myRecipes");
  };
  
  if(imageInput.files && imageInput.files[0]) {
    reader.readAsDataURL(imageInput.files[0]);
  } else {
    reader.onload();
  }
}

function displayAllRecipes() {
  const recipes = getRecipes();
  const container = document.getElementById("recipesTableContainer");
  container.innerHTML = "";
  if(recipes.length === 0) {
    container.innerHTML = "<p>Nincsenek receptek.</p>";
    return;
  }
  const table = document.createElement("table");
  table.className = "recipe-table";
  const tbody = document.createElement("tbody");
  let row;
  recipes.forEach((recipe, index) => {
    if(index % 3 === 0) {
      row = document.createElement("tr");
      tbody.appendChild(row);
    }
    const cell = document.createElement("td");
    let img = document.createElement("img");
    if(recipe.image && recipe.image !== "") {
      img.src = recipe.image;
    } else {
      img.src = "food.jpg";
    }
    img.alt = recipe.title;
    img.className = "recipe-thumb";
    cell.appendChild(img);
    
    const titleDiv = document.createElement("div");
    titleDiv.className = "recipe-title";
    titleDiv.innerHTML = "<strong>" + recipe.title + "</strong>";
    cell.appendChild(titleDiv);
    
    cell.style.cursor = "pointer";
    cell.addEventListener("click", function(){
      showRecipeDetail(recipe.id);
    });
    row.appendChild(cell);
  });
  table.appendChild(tbody);
  container.appendChild(table);
}

function showRecipeDetail(id) {
  const recipes = getRecipes();
  const recipe = recipes.find(r => r.id === id);
  if(!recipe) return;
  const detailContainer = document.getElementById("recipeDetailContent");
  detailContainer.innerHTML = "";
  
  let img = document.createElement("img");
  if(recipe.image && recipe.image !== "") {
    img.src = recipe.image;
  } else {
    img.src = "food.jpg";
  }
  img.alt = recipe.title;
  img.style.width = "100%";
  img.style.maxHeight = "300px";
  img.style.objectFit = "cover";
  detailContainer.appendChild(img);
  
  const titleElem = document.createElement("h2");
  titleElem.className = "recipe-title";
  titleElem.innerText = recipe.title;
  detailContainer.appendChild(titleElem);
  
  const infoDiv = document.createElement("div");
  infoDiv.style.textAlign = "left";
  infoDiv.style.margin = "20px 0";
  
  if(recipe.source) {
    const sourceP = document.createElement("p");
    sourceP.innerHTML = "<em>" + recipe.source + " receptje</em>";
    infoDiv.appendChild(sourceP);
  }
  
  const timeDiv = document.createElement("div");
  timeDiv.className = "prep-time-container";
  timeDiv.innerHTML = "<span>Elkészítési idő: </span><span class='prep-time'>" + recipe.prepTime + "</span>";
  infoDiv.appendChild(timeDiv);
  
  const ingHeader = document.createElement("h3");
  ingHeader.innerText = "Hozzávalók:";
  infoDiv.appendChild(ingHeader);
  
  const ingBox = document.createElement("div");
  ingBox.className = "ingredients-box";
  const ingList = document.createElement("ul");
  recipe.ingredients.forEach(item => {
    const li = document.createElement("li");
    li.innerText = item.qty + " " + item.unit + " " + item.ing;
    ingList.appendChild(li);
  });
  ingBox.appendChild(ingList);
  infoDiv.appendChild(ingBox);
  
  detailContainer.appendChild(infoDiv);
  
  const prepHeader = document.createElement("h3");
  prepHeader.innerText = "Elkészítés:";
  detailContainer.appendChild(prepHeader);
  
  const prepPara = document.createElement("p");
  prepPara.innerText = recipe.preparation;
  detailContainer.appendChild(prepPara);
  
  const favBtn = document.createElement("button");
  favBtn.className = "small-button";
  favBtn.innerText = recipe.favorite ? "Kivessz a kedvencekből" : "Kedvencekhez ad";
  favBtn.addEventListener("click", function(){
    toggleFavorite(recipe.id);
  });
  detailContainer.appendChild(favBtn);
  
  const editBtn = document.createElement("button");
  editBtn.className = "small-button";
  editBtn.style.marginLeft = "10px";
  editBtn.innerText = "Szerkesztés";
  editBtn.addEventListener("click", function(){
    editRecipe(recipe.id);
  });
  detailContainer.appendChild(editBtn);
  
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "small-button";
  deleteBtn.style.marginLeft = "10px";
  deleteBtn.innerText = "Törlés";
  deleteBtn.addEventListener("click", function(){
    deleteRecipe(recipe.id);
  });
  detailContainer.appendChild(deleteBtn);
  
  const pages = document.querySelectorAll(".page");
  pages.forEach(page => page.style.display = "none");
  document.getElementById("recipeDetail").style.display = "block";
}

function closeDetail() {
  showPage("myRecipes");
}

function editRecipe(id) {
  const recipes = getRecipes();
  const recipe = recipes.find(r => r.id === id);
  if(!recipe) return;
  showPage("newRecipe");
  document.getElementById("recipeTitle").value = recipe.title;
  document.getElementById("prepTime").value = recipe.prepTime;
  document.getElementById("recipeSource").value = recipe.source;
  document.getElementById("preparation").value = recipe.preparation;
  
  const container = document.getElementById("ingredientsContainer");
  container.innerHTML = "";
  recipe.ingredients.forEach(ing => {
    addIngredientRow(ing.qty, ing.unit, ing.ing);
  });
  
  document.getElementById("newRecipeForm").setAttribute("data-editing", "true");
  
  if(recipe.image && recipe.image !== "") {
    const previewContainer = document.getElementById("imagePreviewContainer");
    previewContainer.innerHTML = "";
    const img = document.createElement("img");
    img.src = recipe.image;
    img.style.width = "6cm";
    img.style.height = "4cm";
    img.style.objectFit = "cover";
    previewContainer.appendChild(img);
    previewContainer.style.display = "block";
  } else {
    clearSelectedImage();
  }
}

function deleteRecipe(id) {
  if(!confirm("Biztos törlöd a receptet?")) return;
  let recipes = getRecipes();
  recipes = recipes.filter(r => r.id !== id);
  saveRecipes(recipes);
  alert("Recept törölve!");
  showPage("myRecipes");
}

function toggleFavorite(id) {
  let recipes = getRecipes();
  const index = recipes.findIndex(r => r.id === id);
  if(index > -1){
    recipes[index].favorite = !recipes[index].favorite;
    saveRecipes(recipes);
    showRecipeDetail(id);
    displayFavorites();
  }
}

function displayFavorites() {
  const recipes = getRecipes().filter(r => r.favorite);
  const container = document.getElementById("favoritesTableContainer");
  container.innerHTML = "";
  if(recipes.length === 0) {
    container.innerHTML = "<p>Nincsenek kedvenc receptek.</p>";
    return;
  }
  const table = document.createElement("table");
  table.className = "recipe-table";
  const tbody = document.createElement("tbody");
  let row;
  recipes.forEach((recipe, index) => {
    if(index % 3 === 0) {
      row = document.createElement("tr");
      tbody.appendChild(row);
    }
    const cell = document.createElement("td");
    let img = document.createElement("img");
    if(recipe.image && recipe.image !== "") {
      img.src = recipe.image;
    } else {
      img.src = "food.jpg";
    }
    img.alt = recipe.title;
    img.className = "recipe-thumb";
    cell.appendChild(img);
    
    const titleDiv = document.createElement("div");
    titleDiv.className = "recipe-title";
    titleDiv.innerHTML = "<strong>" + recipe.title + "</strong>";
    cell.appendChild(titleDiv);
    
    cell.style.cursor = "pointer";
    cell.addEventListener("click", function(){
      showRecipeDetail(recipe.id);
    });
    row.appendChild(cell);
  });
  table.appendChild(tbody);
  container.appendChild(table);
}

function displaySourceList() {
  const recipes = getRecipes();
  const container = document.getElementById("sourceListContainer");
  container.innerHTML = "";
  let sources = {};
  recipes.forEach(recipe => {
    if(recipe.source && recipe.source.trim() !== "") {
      sources[recipe.source] = true;
    }
  });
  const sourceNames = Object.keys(sources);
  if(sourceNames.length === 0) {
    container.innerHTML = "<p>Nincsenek megadott recepptulajdonosok.</p>";
    return;
  }
  sourceNames.forEach(name => {
    const sourceDiv = document.createElement("div");
    sourceDiv.className = "source-item hover-effect";
    sourceDiv.style.cursor = "pointer";
    sourceDiv.style.padding = "10px";
    sourceDiv.style.borderBottom = "1px solid #ccc";
    sourceDiv.innerText = name;
    sourceDiv.addEventListener("click", function(){
      showRecipesBySource(name);
    });
    container.appendChild(sourceDiv);
  });
}

function showRecipesBySource(source) {
  const recipes = getRecipes().filter(r => r.source === source);
  const container = document.getElementById("sourceListContainer");
  container.innerHTML = "<h3>" + source + " receptjei:</h3>";
  if(recipes.length === 0) {
    container.innerHTML += "<p>Nincsenek receptek erről a forrástól.</p>";
    return;
  }
  const table = document.createElement("table");
  table.className = "recipe-table";
  const tbody = document.createElement("tbody");
  let row;
  recipes.forEach((recipe, index) => {
    if(index % 3 === 0) {
      row = document.createElement("tr");
      tbody.appendChild(row);
    }
    const cell = document.createElement("td");
    let img = document.createElement("img");
    if(recipe.image && recipe.image !== "") {
      img.src = recipe.image;
    } else {
      img.src = "food.jpg";
    }
    img.alt = recipe.title;
    img.className = "recipe-thumb";
    cell.appendChild(img);
    
    const titleDiv = document.createElement("div");
    titleDiv.className = "recipe-title";
    titleDiv.innerHTML = "<strong>" + recipe.title + "</strong>";
    cell.appendChild(titleDiv);
    
    cell.style.cursor = "pointer";
    cell.addEventListener("click", function(){
      showRecipeDetail(recipe.id);
    });
    row.appendChild(cell);
  });
  table.appendChild(tbody);
  container.appendChild(table);
}

function clearAllData() {
  if(confirm("Biztosan törlöd az összes adatot, beleértve a recepteket és a neved is?")) {
    localStorage.removeItem("recipes");
    localStorage.removeItem("userName");
    alert("Minden adat törölve!");
    showNameModal();
    displayAllRecipes();
    displaySourceList();
    displayFavorites();
  }
}
