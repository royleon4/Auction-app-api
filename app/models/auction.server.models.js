

/**
 * return all projects between `limit` and `limit+offset` when ordered by creation timestamp
 *
 */
const getAll = function(options, done){

    let whereConditions = [],
        joinTables = '',
        joinCondition = '',
        whereCondition = '',
        tableSources = {'creator':'seller'};

    // set default options where defaults apply - other options are either filter-or-not
    if (!options.hasOwnProperty('count')) options.count=10000;
    if (!options.hasOwnProperty('startIndex')) options.startIndex=0;

    // construct SQL for option open
    if (options.hasOwnProperty('open')) whereConditions.push(`pr.open=${options['open']}`)

    // construct SQL for JOINs for options for creator and backer
    let parameterKeys = Object.keys(options).filter(option => Object.keys(tableSources).includes(option));
    if (parameterKeys.length > 0) {
        let tables = parameterKeys.map(option => tableSources[option]);
        joinTables = ' JOIN (' + tables.join(', ') + ')';
        joinCondition = ' ON ' + tables.map(table => `pr.id=${table}.projectid`).join(' AND ');
        whereConditions = whereConditions.concat(parameterKeys.map(option => `${tableSources[option]}.userid=${options[option]}`));
    }

    // construct SQL for combined WHERE condition
    if (whereConditions.length > 0) whereCondition = ' WHERE ' + whereConditions.join(' AND ');

    // finalise SQL
    let sql = `SELECT DISTINCT pr.id, pr.title, pr.subtitle, pr.open, exists(select 1 from images where images.projectid=pr.id) as hasImage, pr.ts
     FROM projects pr ${joinTables}${joinCondition}${whereCondition}
     ORDER BY pr.ts DESC LIMIT ? OFFSET ?`;
    log.debug(sql, [options.count, options.startIndex]);

    db.get_pool().query(sql,
        [options.count, options.startIndex],
        (err, projects) => {
            if (err) return done(err);
            if (!projects) return done(err, null);

            // adjust some of the db fields to the right format
            projects.map(project => {
                // if image exists, then set imageUri correctly
                if (project.hasImage) project.imageUri = `/auctions/${project.id}/image`;
                delete project.hasImage;
                delete project.ts; // remove unneeded ts value
                project.open = Boolean(project.open); // munge mysql int boolean to proper boolean
                return project
            });
            return done(err, projects)
        }
    )
};