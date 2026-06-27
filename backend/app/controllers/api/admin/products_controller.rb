module Api
  module Admin
    class ProductsController < ApplicationController
      include AdminAuthorization

      # GET /api/admin/products
      def index
        @products = Product.order(created_at: :desc)
        render json: @products
      end

      # POST /api/admin/products
      def create
        @product = Product.new(product_params)

        if @product.save
          render json: @product, status: :created
        else
          render json: { errors: @product.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/admin/products/:id
      def update
        @product = Product.find(params[:id])

        if @product.update(product_params)
          render json: @product
        else
          render json: { errors: @product.errors.full_messages }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Product not found" }, status: :not_found
      end

      # DELETE /api/admin/products/:id
      def destroy
        @product = Product.find(params[:id])
        @product.destroy!
        head :no_content
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Product not found" }, status: :not_found
      end

      private

      def product_params
        params.require(:product).permit(:id, :title, :description, :price, :original_price, :sale, :thumbnail, :stock, tags: [])
      end
    end
  end
end
