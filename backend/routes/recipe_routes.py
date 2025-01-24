from flask import Blueprint, jsonify, request
from services.recipe_services import RecipeService
import traceback

recipe_bp = Blueprint('recipe', __name__)
recipe_service = RecipeService()

@recipe_bp.route('/get_recipes', methods=['GET'])
def get_recipes():
    try:
        recipes = recipe_service.get_all_recipes()
        return jsonify({"status": "success", "data": recipes}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

@recipe_bp.route('/add_recipe', methods=['POST']) 
def add_recipe():
    data = request.get_json()
    try:
        new_recipe = recipe_service.add_recipe(data)
        return jsonify({"status": "success", "data": new_recipe}), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@recipe_bp.route('/<parameter_name>', methods=['PUT'])
def update_recipe(parameter_name):
    data = request.get_json()
    try:
        updated_recipe = recipe_service.update_recipe(parameter_name, data)
        return jsonify({"status": "success", "data": updated_recipe}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
