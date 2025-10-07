// services/uploadService.js
const fs = require('fs').promises;
const path = require('path');
const { Product } = require('../model/product');

class UploadService {
    constructor() {
        this.uploadDir = path.join(__dirname, '../uploads');
    }

    async handleProductImageUpload(productId, files) {
        const product = await Product.findByPk(productId);
        if (!product) {
            throw new Error('Produto não encontrado');
        }

        const updatedFields = {};

        // Processar imagem principal
        if (files.imagem_principal && files.imagem_principal[0]) {
            updatedFields.imagem_url = files.imagem_principal[0].filename;
        }

        // Processar imagens adicionais
        if (files.imagens_adicionais && files.imagens_adicionais.length > 0) {
            const newImages = files.imagens_adicionais.map(file => file.filename);
            const existingImages = product.imagens_adicionais || [];
            updatedFields.imagens_adicionais = [...existingImages, ...newImages];
        }

        // Atualizar o produto
        await product.update(updatedFields);
        
        return await Product.findByPk(productId); // Retorna o produto atualizado
    }

    async cleanupFiles(files) {
        if (!files) return;

        const allFiles = [
            ...(files.imagem_principal || []),
            ...(files.imagens_adicionais || [])
        ];

        for (const file of allFiles) {
            await this.deleteFile(file.filename);
        }
    }

    async deleteFile(filename) {
        try {
            const filePath = path.join(this.uploadDir, filename);
            await fs.unlink(filePath);
        } catch (error) {
            console.warn(`Não foi possível deletar o arquivo: ${filename}`, error.message);
        }
    }
}

module.exports = new UploadService();