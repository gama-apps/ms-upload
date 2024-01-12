const { uploadToAmazon, paths, downloadToAmazon } = require('./../utils');
class GeneralCtrl {
    constructor() { }

    async uploadFile(req, res) {
        let { path } = req.params;
        const files = req.files,
            session = req.session;
        let { agencyId = session.agencyId, uniqueName, bucket = process.env.AMAZON_BUCKET } = req.body;

        const error = {
            success: false,
            code: 500,
            stack: null,
            message: 'INTERNAL_SERVER_ERROR'
        };

        if (['market_product', 'user_profile_pictures', 'user_business_pictures'].includes(path)) {
            agencyId = 'commons'
        }

        if (!paths.includes(path)) {
            error.code = 400;
            error.message = "INVALID_PATH";
            return res.status(400).json(error);
        }

        if (!files || files.length === 0) {
            error.code = 404;
            error.message = "FILES_IS_REQUIRED";
            return res.status(404).json(error);
        }

        if (['user_profile_pictures', 'user_business_pictures'].includes(path)) {
            path = path + `/${session?._id}`
        }

        try {
            const filesUploaded = [];

            await Promise.all(files.map(async file => {
                let response = await uploadToAmazon(session, {
                    agencyId,
                    bucket,
                    path,
                    file,
                    uniqueName
                });

                filesUploaded.push(response);
            }));

            res.status(200).json({
                code: 200,
                success: true,
                message: 'Ok',
                data: filesUploaded.length === 1 ? filesUploaded[0] : filesUploaded,
                agencyId
            });
        } catch (e) {
            console.error(e.toString());
            error.stack = e.toString();
            res.status(500).json(error);
        }
    }

    async downloadFile(req, res) {
        try {
            const { aws_url } = req
            let rs = await downloadToAmazon({ aws_url })
            rs.Body.pipe(res)
        } catch (e) {
            console.error('donwlogFile error:', e);
            res.status(500).send(e).end();
        }
    }
}

module.exports = new GeneralCtrl();
