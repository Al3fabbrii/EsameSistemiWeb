module Api
  class ProductsController < ApplicationController
    skip_before_action :authenticate_user! # Products sono pubblici

    # GET /api/products
    # Query params:
    #   - search: filtra per titolo (case-insensitive)
    #   - price_min: prezzo minimo
    #   - price_max: prezzo massimo
    #   - sort: 'price_asc', 'price_desc', 'date_asc', 'date_desc' (default: 'date_desc')
    def index
      @products = Product.all

      # Filtro per ricerca nel titolo
      if params[:search].present?
        @products = @products.where('LOWER(title) LIKE ?', "%#{params[:search].downcase}%")
      end

      # Filtro per prezzo minimo
      if params[:price_min].present?
        @products = @products.where('price >= ?', params[:price_min].to_f)
      end

      # Filtro per prezzo massimo
      if params[:price_max].present?
        @products = @products.where('price <= ?', params[:price_max].to_f)
      end

      # Ordinamento
      @products = case params[:sort]
                  when 'price_asc'
                    @products.order(price: :asc)
                  when 'price_desc'
                    @products.order(price: :desc)
                  when 'date_asc'
                    @products.order(created_at: :asc)
                  else # 'date_desc' o default
                    @products.order(created_at: :desc)
                  end

      render json: @products
    end

    # GET /api/products/:id
    def show
      @product = Product.find(params[:id])
      render json: @product
    rescue ActiveRecord::RecordNotFound
      render json: { error: 'Product not found' }, status: :not_found
    end
  end
end
