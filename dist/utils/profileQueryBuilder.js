"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregationBuilder = void 0;
// utils/aggregationBuilder.ts
class AggregationBuilder {
    constructor(model) {
        this.model = model;
        this.pipeline = [];
        this.matchStage = {};
        this.lookupStages = [];
        this.sortStage = {};
        this.paginationStage = {};
    }
    // Add lookup stages
    addLookup(stage) {
        this.lookupStages.push(stage);
        return this;
    }
    // Add multiple lookups
    addLookups(stages) {
        this.lookupStages.push(...stages);
        return this;
    }
    // Add match condition
    addMatch(field, value) {
        if (value !== undefined && value !== null && value !== '') {
            this.matchStage[field] = value;
        }
        return this;
    }
    // Add regex match
    addRegexMatch(field, value) {
        if (value && value.trim() !== '') {
            this.matchStage[field] = { $regex: value.trim(), $options: 'i' };
        }
        return this;
    }
    // Add search across multiple fields
    addSearch(searchTerm, fields) {
        if (searchTerm && searchTerm.trim() !== '') {
            const regex = new RegExp(searchTerm.trim(), 'i');
            this.matchStage.$or = fields.map(field => ({ [field]: regex }));
        }
        return this;
    }
    // Add sort
    addSort(sortString = '-createdAt') {
        if (sortString.startsWith('-')) {
            this.sortStage[sortString.substring(1)] = -1;
        }
        else {
            this.sortStage[sortString] = 1;
        }
        return this;
    }
    // Add pagination
    addPagination(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        this.paginationStage = { skip, limit };
        return this;
    }
    // Build the pipeline
    build() {
        // Add lookups first
        this.pipeline.push(...this.lookupStages);
        // Unwind stages after lookups
        this.lookupStages.forEach((_, index) => {
            const field = this.lookupStages[index].as || `lookup${index}`;
            this.pipeline.push({
                $unwind: {
                    path: `$${field}`,
                    preserveNullAndEmptyArrays: true
                }
            });
        });
        // Add match stage if not empty
        if (Object.keys(this.matchStage).length > 0) {
            this.pipeline.push({ $match: this.matchStage });
        }
        // Add sort
        if (Object.keys(this.sortStage).length > 0) {
            this.pipeline.push({ $sort: this.sortStage });
        }
        return this;
    }
    // Execute with pagination
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // Build pipeline for data
            const dataPipeline = [...this.pipeline];
            // Build pipeline for count
            const countPipeline = [...this.pipeline];
            // Add pagination to data pipeline
            if (this.paginationStage.skip !== undefined) {
                dataPipeline.push({ $skip: this.paginationStage.skip });
            }
            if (this.paginationStage.limit !== undefined) {
                dataPipeline.push({ $limit: this.paginationStage.limit });
            }
            // Execute both queries
            const [data, countResult] = yield Promise.all([
                this.model.aggregate(dataPipeline),
                this.model.aggregate([...countPipeline, { $count: 'total' }])
            ]);
            const total = ((_a = countResult[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
            return {
                data,
                meta: {
                    page: this.paginationStage.skip / this.paginationStage.limit + 1 || 1,
                    limit: this.paginationStage.limit || 10,
                    total,
                    totalPages: Math.ceil(total / (this.paginationStage.limit || 10))
                }
            };
        });
    }
}
exports.AggregationBuilder = AggregationBuilder;
