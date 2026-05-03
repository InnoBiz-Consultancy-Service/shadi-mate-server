// utils/aggregationBuilder.ts

export class AggregationBuilder {
    private pipeline: any[] = [];
    private matchStage: any = {};
    private lookupStages: any[] = [];
    private sortStage: any = {};
    private paginationStage: any = {};
    private projectStage: any = null; // Add project stage
    private unwindStages: any[] = []; // Track unwinds separately

    constructor(private model: any) { }

    // Add lookup stages
    addLookup(stage: any) {
        this.lookupStages.push(stage);
        return this;
    }

    // Add multiple lookups
    addLookups(stages: any[]) {
        this.lookupStages.push(...stages);
        return this;
    }

    // Add match condition
    addMatch(field: string | object, value?: any) {
        if (typeof field === 'object') {
            // If field is an object, merge it with existing matchStage
            this.matchStage = { ...this.matchStage, ...field };
        } else if (value !== undefined && value !== null && value !== '') {
            this.matchStage[field] = value;
        }
        return this;
    }

    // Add regex match
    addRegexMatch(field: string, value: string) {
        if (value && value.trim() !== '') {
            this.matchStage[field] = { $regex: value.trim(), $options: 'i' };
        }
        return this;
    }

    // Add search across multiple fields
    addSearch(searchTerm: string | undefined, fields: string[]) {
        if (searchTerm && searchTerm.trim() !== '') {
            const regex = new RegExp(searchTerm.trim(), 'i');
            this.matchStage.$or = fields.map(field => ({ [field]: regex }));
        }
        return this;
    }

    // Add project stage
    addProject(projection: any) {
        this.projectStage = projection;
        return this;
    }

    // Add sort
    addSort(sortString: string = '-createdAt') {
        if (sortString.startsWith('-')) {
            this.sortStage[sortString.substring(1)] = -1;
        } else {
            this.sortStage[sortString] = 1;
        }
        return this;
    }

    // Add pagination
    addPagination(page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;
        this.paginationStage = { skip, limit };
        return this;
    }

    // Build the pipeline
    build() {
        const pipeline: any[] = [];
        
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
    async execute() {
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
        const [data, countResult] = await Promise.all([
            this.model.aggregate(dataPipeline),
            this.model.aggregate([...countPipelineWithoutProject, { $count: 'total' }])
        ]);
        
        const total = countResult[0]?.total || 0;
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