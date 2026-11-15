import { LocationProvider, Route, Router } from "preact-iso";
import { RecipesProvider } from "./lib/recipes";
import { SelectionProvider } from "./lib/selection";
import { IngredientsPage } from "./pages/IngredientsPage";
import { RecipeDetailPage } from "./pages/RecipeDetailPage";
import { RecipeFormPage } from "./pages/RecipeFormPage";
import { RecipeListPage } from "./pages/RecipeListPage";

export function App() {
  return (
    <LocationProvider>
      <RecipesProvider>
        <SelectionProvider>
          <div class="mx-auto min-h-dvh max-w-lg">
            <Router>
              <Route path="/" component={RecipeListPage} />
              <Route path="/ingredients" component={IngredientsPage} />
              <Route path="/recipes/new" component={RecipeFormPage} />
              <Route path="/recipes/:id/edit" component={RecipeFormPage} />
              <Route path="/recipes/:id" component={RecipeDetailPage} />
              <Route default component={RecipeListPage} />
            </Router>
          </div>
        </SelectionProvider>
      </RecipesProvider>
    </LocationProvider>
  );
}
