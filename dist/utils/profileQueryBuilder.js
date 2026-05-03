"use strict";
// utils/aggregationBuilder.ts
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
class AggregationBuilder {
    constructor(model) {
        this.model = model;
        this.pipeline = [];
        this.matchStage = {};
        this.lookupStages = [];
        this.sortStage = {};
        this.paginationStage = {};
        this.projectStage = null; // Add project stage
        this.unwindStages = []; // Track unwinds separately
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
        if (typeof field === 'object') {
            // If field is an object, merge it with existing matchStage
            this.matchStage = Object.assign(Object.assign({}, this.matchStage), field);
        }
        else if (value !== undefined && value !== null && value !== '') {
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
    // Add project stage
    addProject(projection) {
        this.projectStage = projection;
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
        const pipeline = [];
        // Add lookups first
        pipeline.push(...this.lookupStages);
        // Add unwind for each lookup if not already handled
        this.lookupStages.forEach((lookup, index) => {
            const as = lookup.as || `lookup${index}`;
            pipeline.push({
                $unwind: {
                    path: `$${as}`,
                    preserveNullAndEmptyArrays: true
                }
            });
        });
        // Add custom unwind stages if any
        if (this.unwindStages.length > 0) {
            pipeline.push(...this.unwindStages);
        }
        // Add match stage
        if (Object.keys(this.matchStage).length > 0) {
            pipeline.push({ $match: this.matchStage });
        }
        // Add project stage
        if (this.projectStage) {
            pipeline.push({ $project: this.projectStage });
        }
        // Add sort stage
        if (Object.keys(this.sortStage).length > 0) {
            pipeline.push({ $sort: this.sortStage });
        }
        // Store pipeline for execution
        this.pipeline = pipeline;
        return this;
    }
    // Execute with pagination
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // Build pipeline for data
            const dataPipeline = [...this.pipeline];
            // Build pipeline for count (remove project stage for count)
            const countPipeline = [...this.pipeline];
            // Remove project stage from count pipeline if exists
            const countPipelineWithoutProject = countPipeline.filter(stage => !stage.$project);
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
                this.model.aggregate([...countPipelineWithoutProject, { $count: 'total' }])
            ]);
            const total = ((_a = countResult[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
            const limit = this.paginationStage.limit || 10;
            const skip = this.paginationStage.skip || 0;
            return {
                data,
                meta: {
                    page: Math.floor(skip / limit) + 1,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        });
    }
    // Reset all stages (useful for reusing the builder)
    reset() {
        this.pipeline = [];
        this.matchStage = {};
        this.lookupStages = [];
        this.sortStage = {};
        this.paginationStage = {};
        this.projectStage = null;
        this.unwindStages = [];
        return this;
    }
}
exports.AggregationBuilder = AggregationBuilder;
