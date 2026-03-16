// utils/aggregationBuilder.ts
export class AggregationBuilder {
    private pipeline: any[] = [];
    private matchStage: any = {};
    private lookupStages: any[] = [];
    private sortStage: any = {};
    private paginationStage: any = {};

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
    addMatch(field: string, value: any) {
        if (value !== undefined && value !== null && value !== '') {
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
    async execute() {
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
        const [data, countResult] = await Promise.all([
            this.model.aggregate(dataPipeline),
            this.model.aggregate([...countPipeline, { $count: 'total' }])
        ]);

        const total = countResult[0]?.total || 0;

        return {
            data,
            meta: {
                page: this.paginationStage.skip / this.paginationStage.limit + 1 || 1,
                limit: this.paginationStage.limit || 10,
                total,
                totalPages: Math.ceil(total / (this.paginationStage.limit || 10))
            }
        };
    }
}