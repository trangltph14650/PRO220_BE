import _ from 'lodash';
import mongoose from 'mongoose';
import { warehouseModel } from '../models';

export const create = (data) => {
    const warehouse = {
        showroomId: data.showroomId,
        materials: [...data.materials],
    };
    return new warehouseModel(warehouse).save();
};

export const getFullWarehouseInformation = async (data) => {
    return await warehouseModel
        .find({ deleted: false, showroomId: { _id: data.id } })
        .populate({ path: 'showroomId', select: 'name' })
        .populate({
            path: 'materials.materialId',
            match: { deleted: false },
            select: ['name', 'price', 'quantity', 'image', 'deleted'],
        })
        .exec();
};

export const updateWarehouseQuantity = (showroomWarehouse) => {
    return updateQuantityMaterials(showroomWarehouse);
};

export const updateWarehouseManyQuantity = (showroomWarehouse) => {
    return updateQuantityMaterial(showroomWarehouse);
};

const updateQuantityMaterials = (showroomWarehouse) => {
    showroomWarehouse.materials.forEach(async (material) => {
        try {
            const listCurrentMaterial = await warehouseModel.findOne({ 'materials.materialId': material.materialId });
            const materialObj = listCurrentMaterial.materials.find(
                (itemMateral) => itemMateral.materialId == material.materialId,
            );
            return await warehouseModel.updateOne(
                {
                    showroomId: mongoose.Types.ObjectId(showroomWarehouse.showroomId),
                    'materials.materialId': mongoose.Types.ObjectId(material.materialId),
                },
                {
                    $set: { 'materials.$.quantity': materialObj.quantity - material.qty },
                },
            );
        } catch (error) {
            return error;
        }
    });
};

const updateQuantityMaterial = async (dataObj) => {
    try {
        return await warehouseModel.updateOne(
            {
                showroomId: mongoose.Types.ObjectId(dataObj.idShowroom),
                'materials.materialId': mongoose.Types.ObjectId(dataObj.material.materialId),
            },
            {
                $set: { 'materials.$.quantity': dataObj.material.quantity },
            },
        );
    } catch (error) {
        return error;
    }
};

export const updateQuantityMaterialBack = async (dataObj) => {
    try {
        const dataWarehouse = await warehouseModel.findOne({ showroomId: dataObj.idShowroom });
        const material = dataWarehouse.materials.find((part) => part.materialId == dataObj.material.materialId);
        const dataUpdate = await warehouseModel.updateOne(
            {
                showroomId: mongoose.Types.ObjectId(dataObj.idShowroom),
                'materials.materialId': mongoose.Types.ObjectId(dataObj.material.materialId),
            },
            {
                $set: { 'materials.$.quantity': dataObj.material.quantity + material.quantity },
            },
        );
        return dataUpdate;
    } catch (error) {
        return error;
    }
};

const searchMaterial = (materials, name) => {
    return materials.filter((material) => material.materialId.name.toLowerCase().includes(name.toLowerCase()));
};

export const filterWarehouseMaterial = async (data) => {
    const listData = await warehouseModel.findOne({ showroomId: data.query.showroomId }).populate({
        path: 'materials.materialId',
        match: { deleted: false },
        select: ['name', 'price', 'quantity', 'image', 'deleted'],
    });
    return searchMaterial(listData.materials, data.body.name);
};